#!/usr/bin/env python3
"""Build/inspect unsigned macOS flat packages without running Apple's tools.

Uses standard XAR + gzip/odc-cpio + BOM formats. The BOM comes from pinned
bomutils; this is not a substitute for testing Apple's Installer on a Mac.
"""
import datetime
import gzip
import hashlib
import io
import os
from pathlib import Path, PurePosixPath
import plistlib
import shutil
import stat
import struct
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zlib

HERE = Path(__file__).resolve().parent
EPOCH = int(os.environ.get('SOURCE_DATE_EPOCH', '1791936000'))
STAMP = datetime.datetime.fromtimestamp(EPOCH, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
ARCH = {'arm64': (0x100000c, 'arm64', 'Apple Silicon'), 'x64': (0x1000007, 'x86_64', 'Intel')}


def xml_bytes(element):
    return ET.tostring(element, encoding='utf-8', xml_declaration=True)


def make_xar(entries, output):
    """Uncompressed XAR members; the Payload member is itself gzipped cpio."""
    xar = ET.Element('xar')
    toc = ET.SubElement(xar, 'toc')
    ET.SubElement(toc, 'creation-time').text = STAMP
    checksum = ET.SubElement(toc, 'checksum', style='sha1')
    ET.SubElement(checksum, 'offset').text = '0'
    ET.SubElement(checksum, 'size').text = '20'
    parents = {'': toc}
    heap = []
    offset = 20
    number = 0
    for name, data in entries.items():
        parts = PurePosixPath(name).parts
        for i in range(1, len(parts)):
            directory = '/'.join(parts[:i])
            if directory not in parents:
                number += 1
                item = ET.SubElement(parents['/'.join(parts[:i-1])], 'file', id=str(number))
                ET.SubElement(item, 'name').text = parts[i-1]
                ET.SubElement(item, 'type').text = 'directory'
                ET.SubElement(item, 'mode').text = '0755'
                ET.SubElement(item, 'uid').text = '0'
                ET.SubElement(item, 'gid').text = '0'
                parents[directory] = item
        number += 1
        item = ET.SubElement(parents['/'.join(parts[:-1])], 'file', id=str(number))
        ET.SubElement(item, 'name').text = parts[-1]
        ET.SubElement(item, 'type').text = 'file'
        ET.SubElement(item, 'mode').text = '0644'
        ET.SubElement(item, 'uid').text = '0'
        ET.SubElement(item, 'gid').text = '0'
        ET.SubElement(item, 'mtime').text = STAMP
        info = ET.SubElement(item, 'data')
        for key, value in [('length', len(data)), ('offset', offset), ('size', len(data))]:
            ET.SubElement(info, key).text = str(value)
        ET.SubElement(info, 'encoding', style='application/octet-stream')
        for key in ['archived-checksum', 'extracted-checksum']:
            ET.SubElement(info, key, style='sha1').text = hashlib.sha1(data).hexdigest()
        offset += len(data)
        heap.append(data)
    raw = xml_bytes(xar)
    toc_data = zlib.compress(raw, 9)
    with open(output, 'wb') as file:
        file.write(struct.pack('>IHHQQI', 0x78617221, 28, 1, len(toc_data), len(raw), 1))
        file.write(toc_data)
        file.write(hashlib.sha1(toc_data).digest())
        for data in heap:
            file.write(data)


def read_xar(data):
    magic, size, version, compressed, raw_size, algorithm = struct.unpack_from('>IHHQQI', data)
    assert (magic, size, version, algorithm) == (0x78617221, 28, 1, 1)
    toc_data = data[size:size+compressed]
    raw = zlib.decompress(toc_data)
    assert len(raw) == raw_size
    heap = size + compressed
    assert data[heap:heap+20] == hashlib.sha1(toc_data).digest()
    toc = ET.fromstring(raw).find('toc')
    assert toc.findtext('checksum/offset') == '0'
    assert toc.findtext('checksum/size') == '20'
    entries = {}
    def walk(parent, prefix=''):
        for entry in parent.findall('file'):
            name = prefix + entry.findtext('name')
            assert '..' not in PurePosixPath(name).parts and not name.startswith('/')
            if entry.findtext('type') == 'directory':
                walk(entry, name+'/')
                continue
            info = entry.find('data')
            offset, length = int(info.findtext('offset')), int(info.findtext('length'))
            member = data[heap+offset:heap+offset+length]
            assert len(member) == length == int(info.findtext('size'))
            assert info.find('encoding').get('style') == 'application/octet-stream'
            digest = hashlib.sha1(member).hexdigest()
            assert digest == info.findtext('archived-checksum') == info.findtext('extracted-checksum')
            assert name not in entries
            entries[name] = member
    walk(toc)
    return entries


def all_paths(stage):
    return [stage] + sorted(stage.rglob('*'))


def write_cpio(stage, output):
    with gzip.GzipFile(filename=str(output), mode='wb', compresslevel=9, mtime=EPOCH) as archive:
        def header(name, inode, mode, size, links=1):
            encoded = name.encode('utf-8') + b'\0'
            fields = [(0,6),(inode,6),(mode,6),(0,6),(80,6),(links,6),(0,6),(EPOCH,11),(len(encoded),6),(size,11)]
            value = b'070707' + ''.join(format(value, '0'+str(width)+'o') for value,width in fields).encode()
            assert len(value) == 76
            archive.write(value)
            archive.write(encoded)
        for i, entry in enumerate(all_paths(stage), 1):
            name = '.' if entry == stage else './'+entry.relative_to(stage).as_posix()
            info = entry.lstat()
            if entry.is_symlink():
                body = os.readlink(entry).encode()
                header(name, i, info.st_mode, len(body))
                archive.write(body)
            elif entry.is_dir():
                header(name, i, info.st_mode, 0, 2)
            else:
                header(name, i, info.st_mode, info.st_size)
                with entry.open('rb') as file:
                    shutil.copyfileobj(file, archive)
        header('TRAILER!!!', 0, 0, 0)
        archive.write(b'\0' * ((-archive.tell()) % 512))


def verify_cpio(data, stage):
    expected = {'.' if p == stage else './'+p.relative_to(stage).as_posix():p for p in all_paths(stage)}
    found = set()
    with gzip.GzipFile(fileobj=io.BytesIO(data), mode='rb') as file:
        while True:
            header = file.read(76)
            assert header[:6] == b'070707' and len(header) == 76
            mode, uid, gid = (int(header[a:b],8) for a,b in [(18,24),(24,30),(30,36)])
            namesize, length = int(header[59:65],8), int(header[65:76],8)
            name = file.read(namesize)
            assert name.endswith(b'\0')
            name = name[:-1].decode()
            if name == 'TRAILER!!!':
                assert length == 0
                break
            assert name in expected and name not in found
            assert '..' not in PurePosixPath(name).parts and not name.startswith('/')
            found.add(name)
            original = expected[name]
            assert (uid,gid) == (0,80)
            assert mode == original.lstat().st_mode
            content = hashlib.sha256()
            remaining = length
            while remaining:
                chunk = file.read(min(1024*1024,remaining))
                assert chunk
                content.update(chunk)
                remaining -= len(chunk)
            if original.is_symlink():
                assert original.resolve().is_relative_to(stage.resolve())
                original_hash = hashlib.sha256(os.readlink(original).encode()).digest()
            elif original.is_dir():
                assert length == 0
                original_hash = hashlib.sha256(b'').digest()
            else:
                with original.open('rb') as input:
                    original_hash = hashlib.file_digest(input,'sha256').digest()
            assert content.digest() == original_hash, name
        assert not file.read().strip(b'\0')
    assert found == expected.keys()
    return found


def icon():
    # Reuse the original Forge mark from our Windows icon; encode a macOS ic08 PNG.
    ico = (HERE.parent/'windows/forge.ico').read_bytes()
    count = struct.unpack_from('<H',ico,4)[0]
    for i in range(count):
        width,height,_,_,_,_,length,offset=struct.unpack_from('<BBBBHHII',ico,6+i*16)
        if width == 0:
            bitmap=ico[offset:offset+length]
            break
    rows=[]
    for y in range(255,-1,-1):
        row=bytearray(b'\0')
        for x in range(256):
            b,g,r,a=bitmap[40+(y*256+x)*4:44+(y*256+x)*4]
            row+=bytes((r,g,b,a))
        rows.append(row)
    def chunk(kind,body):
        return struct.pack('>I',len(body))+kind+body+struct.pack('>I',zlib.crc32(kind+body)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',256,256,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows),9))+chunk(b'IEND',b'')
    item=b'ic08'+struct.pack('>I',len(png)+8)+png
    return b'icns'+struct.pack('>I',len(item)+8)+item


def app_bundle(stage, arch, title, executable, identifier):
    app=stage/'Applications'/(title+'.app')/'Contents'
    (app/'MacOS').mkdir(parents=True,exist_ok=True)
    (app/'Resources').mkdir(exist_ok=True)
    shutil.copyfile(HERE/executable,app/'MacOS'/executable)
    (app/'MacOS'/executable).chmod(0o755)
    with (app/'Info.plist').open('wb') as file:
        plistlib.dump({'CFBundleDevelopmentRegion':'en','CFBundleDisplayName':title,'CFBundleExecutable':executable,'CFBundleIconFile':'Forge.icns','CFBundleIdentifier':identifier,'CFBundleInfoDictionaryVersion':'6.0','CFBundleName':title,'CFBundlePackageType':'APPL','CFBundleShortVersionString':'1.0.0','CFBundleVersion':'1.0.0','LSMinimumSystemVersion':'11.0','LSUIElement':True,'LSArchitecturePriority':[ARCH[arch][1]]},file)
    (app/'Resources/Forge.icns').write_bytes(icon())
    (app/'PkgInfo').write_bytes(b'APPL????')


def inspect_node(node, arch):
    with node.open('rb') as file:
        data=file.read(65536)
    magic,cpu,_,filetype,ncmds,_,_,_=struct.unpack_from('<8I',data)
    assert (magic,cpu,filetype)==(0xfeedfacf,ARCH[arch][0],2)
    offset=32
    minimum=None
    signature=False
    for _ in range(ncmds):
        command,size=struct.unpack_from('<II',data,offset)
        assert size >= 8
        if command==0x32:
            platform,minimum=struct.unpack_from('<II',data,offset+8)
            assert platform==1
        if command==0x1d:
            signature=True
        offset+=size
    assert minimum is not None and minimum <= (11<<16)
    assert signature, 'Expect upstream Node code-signature load command; not a trust validation.'
    assert node.stat().st_mode&0o111


def build(stage,arch,mkbom,output):
    app_bundle(stage,arch,'Forge Coding Academy','Forge','local.forge.academy')
    app_bundle(stage,arch,'Stop Forge','StopForge','local.forge.academy.stop')
    node=stage/'Applications/Forge Coding Academy.app/Contents/Resources/node'
    for file in all_paths(stage):
        if not file.is_symlink():
            file.chmod(0o755 if file.is_dir() or file==node or file.name in ['Forge','StopForge'] else 0o644)
    inspect_node(node,arch)
    identifier='local.forge.academy.pkg'
    paths=all_paths(stage)
    kilobytes=(sum(p.lstat().st_size for p in paths if not p.is_dir())+1023)//1024
    info=ET.Element('pkg-info',{'format-version':'2','identifier':identifier,'version':'1.0.0','install-location':'/','auth':'root'})
    ET.SubElement(info,'payload',{'installKBytes':str(kilobytes),'numberOfFiles':str(len(paths))})
    with tempfile.TemporaryDirectory(dir=stage.parent) as temp:
        temp=Path(temp)
        subprocess.run([mkbom,'-u','0','-g','80',str(stage),str(temp/'Bom')],check=True)
        write_cpio(stage,temp/'Payload')
        make_xar({'PackageInfo':xml_bytes(info),'Bom':(temp/'Bom').read_bytes(),'Payload':(temp/'Payload').read_bytes()},temp/'forge.pkg')
        distribution=ET.Element('installer-gui-script',{'minSpecVersion':'2'})
        ET.SubElement(distribution,'title').text='Forge Coding Academy — '+ARCH[arch][2]
        ET.SubElement(distribution,'organization').text='local.forge'
        ET.SubElement(distribution,'domains',{'enable_anywhere':'false','enable_currentUserHome':'false','enable_localSystem':'true'})
        ET.SubElement(distribution,'options',{'customize':'never','require-scripts':'false','hostArchitectures':ARCH[arch][1]})
        versions=ET.SubElement(distribution,'allowed-os-versions')
        ET.SubElement(versions,'os-version',{'min':'11.0'})
        ET.SubElement(distribution,'welcome',{'file':'welcome.txt','mime-type':'text/plain'})
        ET.SubElement(distribution,'conclusion',{'file':'conclusion.txt','mime-type':'text/plain'})
        outline=ET.SubElement(distribution,'choices-outline')
        ET.SubElement(outline,'line',{'choice':'forge'})
        choice=ET.SubElement(distribution,'choice',{'id':'forge','visible':'false','title':'Forge Coding Academy'})
        ET.SubElement(choice,'pkg-ref',{'id':identifier})
        ET.SubElement(distribution,'pkg-ref',{'id':identifier,'version':'1.0.0','installKBytes':str(kilobytes),'auth':'Root'}).text='forge.pkg'
        conclusion=b'Open Applications > Forge Coding Academy to start.\nOpen Applications > Stop Forge to stop its local server.\n\nProgress is saved in ~/Library/Application Support/ForgeAcademy.\nThis installation does not import your online preview progress.\n'
        make_xar({'Distribution':xml_bytes(distribution),'Resources/welcome.txt':(HERE/'READ-ME.txt').read_bytes(),'Resources/conclusion.txt':conclusion,'forge.pkg':(temp/'forge.pkg').read_bytes()},output)


def verify(output,stage,arch,lsbom):
    outer=read_xar(output.read_bytes())
    assert set(outer)=={'Distribution','Resources/welcome.txt','Resources/conclusion.txt','forge.pkg'}
    distribution=ET.fromstring(outer['Distribution'])
    assert distribution.find('options').get('hostArchitectures')==ARCH[arch][1]
    assert distribution.find('allowed-os-versions/os-version').get('min')=='11.0'
    assert distribution.find('domains').get('enable_localSystem')=='true'
    inner=read_xar(outer['forge.pkg'])
    assert set(inner)=={'PackageInfo','Bom','Payload'}  # No privileged installer scripts.
    info=ET.fromstring(inner['PackageInfo'])
    assert info.get('install-location')=='/'
    assert inner['Bom'].startswith(b'BOMStore')
    names=verify_cpio(inner['Payload'],stage)
    assert len(names)==int(info.find('payload').get('numberOfFiles'))
    with tempfile.NamedTemporaryFile() as file:
        file.write(inner['Bom']);file.flush()
        bom=subprocess.check_output([lsbom,file.name],text=True)
    assert {line.split('\t')[0] for line in bom.splitlines() if line.strip()}==names
    for name in names:
        assert name=='.' or name=='./Applications' or name.startswith(('./Applications/Forge Coding Academy.app/','./Applications/Stop Forge.app/')) or name in ('./Applications/Forge Coding Academy.app','./Applications/Stop Forge.app')
        assert '.data' not in PurePosixPath(name).parts and not name.endswith(('.db','.db-wal','.db-shm','local-server.json','.env'))
    for title in ['Forge Coding Academy','Stop Forge']:
        app=stage/'Applications'/(title+'.app')/'Contents'
        metadata=plistlib.loads((app/'Info.plist').read_bytes())
        executable=app/'MacOS'/metadata['CFBundleExecutable']
        assert executable.stat().st_mode&0o111
        subprocess.run(['/bin/sh','-n',str(executable)],check=True)
    inspect_node(stage/'Applications/Forge Coding Academy.app/Contents/Resources/node',arch)
    print('PASS:',ARCH[arch][2],'- XAR checksums, BOM membership, every payload hash, permissions, Mach-O architecture/minimum OS, plists, shell syntax, no private data or installer scripts.')


if __name__=='__main__':
    if sys.argv[1]=='build':
        build(Path(sys.argv[2]),sys.argv[3],sys.argv[4],Path(sys.argv[5]))
    elif sys.argv[1]=='verify':
        verify(Path(sys.argv[2]),Path(sys.argv[3]),sys.argv[4],sys.argv[5])
    else:
        raise SystemExit('Expected build or verify')
