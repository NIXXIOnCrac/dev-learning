import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  Icon,
  Brand,
  Progress,
  Pill,
  LanguageIcon,
  HeroArt,
  Modal,
  Empty,
  api,
} from "./ui.jsx";
import {
  lessons,
  orderedLessons,
  challenges,
  paths,
  projects,
  badges,
  courses,
  courseForLesson,
  lessonsForCourse,
  prerequisitesFor,
  nextLessonFor,
  courseProgress,
} from "./content.js";
import ReviewQueue, { RecommendationCard } from "./ReviewQueue.jsx";
import { reviewQueue } from "./learning.js";
const Workspace = lazy(() => import("./Workspace.jsx"));
const ProjectWorkspace = lazy(() =>
  import("./Workspace.jsx").then((m) => ({ default: m.ProjectWorkspace })),
);
const Playground = lazy(() =>
  import("./Workspace.jsx").then((m) => ({ default: m.Playground })),
);
const navigation = [
  { label: "Overview", icon: "dashboard", id: "overview" },
  { label: "Learning path", icon: "route", id: "path" },
  { label: "Challenges", icon: "swords", id: "challenges" },
  { label: "Projects", icon: "folder", id: "projects" },
  { label: "Playground", icon: "terminal", id: "playground" },
];
const community = [
  { label: "Review queue", icon: "reset", id: "review" },
  { label: "My achievements", icon: "trophy", id: "achievements" },
  { label: "Learning insights", icon: "trending", id: "insights" },
];
export default function App() {
  const [state, setState] = useState(null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [editorCode, setEditorCode] = useState("");
  const [project, setProject] = useState(null);
  const [mode, setMode] = useState("learn");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [tutor, setTutor] = useState(null);
  const [tutorConfigured, setTutorConfigured] = useState(false);
  const [error, setError] = useState("");
  function notify(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }
  function load() {
    setError("");
    api("state")
      .then((d) => {
        setState(d.state);
        setUser(d.user);
        setTutorConfigured(d.tutorConfigured);
      })
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);
  useEffect(() => {
    const handle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal({ type: "search" });
      }
      if (e.key === "Escape") {
        setMobile(false);
        setTutor(null);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  function navigate(id, courseId) {
    if (courseId) setSelectedCourse(courseId);
    setWorkspace(null);
    setProject(null);
    setPage(id);
    setMobile(false);
    window.scrollTo(0, 0);
  }
  function openLesson(lesson, m = "learn") {
    const requirements = prerequisitesFor(lesson);
    if (requirements.some((id) => !state.completed.includes(id))) {
      notify(
        "Build your foundation first. Complete the preceding lessons to unlock this one.",
        "info",
      );
      return;
    }
    const course = courseForLesson(lesson);
    setSelectedCourse(course.id);
    setState((s) => ({ ...s, activeCourse: course.id }));
    api("state", { activeCourse: course.id }, "PATCH").catch((e) =>
      notify(e.message, "error"),
    );
    setWorkspace(lesson);
    setProject(null);
    setMode(m);
    setModal(null);
    setMobile(false);
    window.scrollTo(0, 0);
  }
  function openProject(p) {
    if (!p.available) {
      setModal({
        type: "planned",
        item: {
          ...p,
          name: p.type,
          topics: [
            "Learn the prerequisites",
            "Follow guided project milestones",
            "Build independently",
            "Test and export your application",
          ],
        },
      });
      return;
    }
    if (p.requires.some((id) => !state.completed.includes(id))) {
      notify("Complete the Functions lesson to unlock this project.", "info");
      return;
    }
    setProject(p);
    setWorkspace(null);
    setPage("projects");
    window.scrollTo(0, 0);
  }
  if (!state)
    return (
      <div className="boot-screen">
        <Brand />
        <div>
          {error ? (
            <>
              <p>{error}</p>
              <button className="button primary" onClick={load}>
                Try again
              </button>
            </>
          ) : (
            <>
              <Icon name="loading" className="spin" /> Setting up your next
              chapter…
            </>
          )}
        </div>
      </div>
    );
  const nextLesson = nextLessonFor(state) || orderedLessons[0];
  const complete = orderedLessons.filter((l) =>
    state.completed.includes(l.id),
  ).length;
  const level = Math.floor(state.xp / 250) + 1;
  const activePage = workspace ? "path" : page;
  const name =
    state.settings.name !== "Developer"
      ? state.settings.name
      : user?.name || "Developer";
  return (
    <div className="app">
      <div
        className={`sidebar-scrim ${mobile ? "visible" : ""}`}
        onClick={() => setMobile(false)}
      />
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <button
          className="brand-button"
          aria-label="Go to overview"
          onClick={() => navigate("overview")}
        >
          <Brand />
        </button>
        <div className="workspace-select">
          <span className="workspace-avatar">
            <Icon name="code" size={17} />
          </span>
          <div>
            Personal workspace<small>Your next chapter starts here</small>
          </div>
          <Icon name="down" size={14} />
        </div>
        <div className="nav-caption">YOUR WORKSPACE</div>
        <nav>
          {navigation.map((n) => (
            <button
              className={`nav-item ${activePage === n.id ? "active" : ""}`}
              key={n.id}
              onClick={() => navigate(n.id)}
            >
              <Icon name={n.icon} size={19} />
              <span>{n.label}</span>
              {n.id === "path" && <span className="nav-badge">01</span>}
              {n.id === "challenges" && <span className="new-dot" />}
            </button>
          ))}
        </nav>
        <div className="nav-caption second">YOUR GROWTH</div>
        <nav>
          {community.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${activePage === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <Icon name={n.icon} size={19} />
              <span>{n.label}</span>
            </button>
          ))}
          <button
            className="nav-item tutor-nav"
            disabled={!!workspace && mode === "exam"}
            title={
              workspace && mode === "exam"
                ? "Tutor is disabled during exams"
                : "Your coding companion"
            }
            onClick={() =>
              setTutor({
                lesson: workspace?.id || nextLesson.id,
                code: workspace ? editorCode : undefined,
              })
            }
          >
            <Icon name="sparkles" size={19} />
            <span>Coding tutor</span>
            <span className="tiny-tag">
              {tutorConfigured ? "AI" : "GUIDED"}
            </span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="level-card">
            <div className="level-top">
              <span className="rank-icon">
                <Icon name="gem" size={19} />
              </span>
              <div>
                <strong>
                  {level < 3
                    ? "Code apprentice"
                    : level < 6
                      ? "Code explorer"
                      : "Code builder"}
                </strong>
                <small>Level {level}</small>
              </div>
              <Icon name="sparkles" size={14} />
            </div>
            <Progress value={((state.xp % 250) / 250) * 100} />
            <div className="level-xp">
              <span>{state.xp % 250} / 250 XP</span>
              <span>Level {level + 1}</span>
            </div>
          </div>
          <button
            className="nav-item help-item"
            onClick={() => setModal({ type: "help" })}
          >
            <Icon name="help" size={18} />
            <span>A little guidance</span>
            <Icon name="up" size={15} />
          </button>
          <div className="profile">
            <button
              className="profile-main"
              onClick={() => setModal({ type: "account" })}
            >
              <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{name}</strong>
                <small>
                  {user?.email ? "Personal account" : "Your learning space"}
                </small>
              </span>
            </button>
            <button
              className="icon-button"
              aria-label="Open settings"
              onClick={() => setModal({ type: "settings" })}
            >
              <Icon name="settings" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open menu"
              onClick={() => setMobile(!mobile)}
            >
              <Icon name="menu" />
            </button>
            <Icon name="dashboard" size={16} />
            <span className="topbar-slash">/</span>
            <span>
              {workspace
                ? "Learning workspace"
                : project
                  ? "Project workspace"
                  : [...navigation, ...community].find((n) => n.id === page)
                      ?.label}
            </span>
          </div>
          <div className="topbar-right">
            <button
              className="search-trigger"
              onClick={() => setModal({ type: "search" })}
            >
              <Icon name="search" size={16} />
              <span>Find your next skill</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="topbar-divider" />
            <button
              className="streak"
              onClick={() => setModal({ type: "activity" })}
            >
              <Icon name="flame" size={18} />
              <strong>{state.goalDays.length}</strong>
              <span>
                learning {state.goalDays.length === 1 ? "day" : "days"}
              </span>
            </button>
            <button
              className="xp-total"
              onClick={() => navigate("achievements")}
            >
              <Icon name="zap" size={17} />
              {state.xp} XP
            </button>
            <button
              className="icon-button notification"
              aria-label="Activity notifications"
              onClick={() => setModal({ type: "activity" })}
            >
              <Icon name="bell" size={19} />
              {state.activity.length > 0 && <i />}
            </button>
            <button
              className="avatar top-avatar"
              onClick={() => setModal({ type: "account" })}
              aria-label="Your account"
            >
              {name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <Suspense
          fallback={
            <div className="workspace-loading">
              <Icon name="loading" className="spin" />
              Preparing your coding workspace…
            </div>
          }
        >
          {workspace ? (
            <Workspace
              key={`${workspace.id}`}
              lesson={workspace}
              state={state}
              setState={setState}
              mode={mode}
              setMode={(m) => {
                setMode(m);
                if (m === "exam") setTutor(null);
              }}
              onBack={() =>
                navigate(
                  workspace.difficulty ? "challenges" : "path",
                  courseForLesson(workspace).id,
                )
              }
              onNext={() => {
                const course = courseForLesson(workspace);
                const idx = course.lessons.findIndex(
                  (l) => l.id === workspace.id,
                );
                if (workspace.difficulty) {
                  navigate("challenges");
                  return;
                }
                if (idx >= 0 && idx < course.lessons.length - 1)
                  openLesson(course.lessons[idx + 1]);
                else {
                  navigate("path", course.id);
                  setModal({ type: "courseComplete", course });
                }
              }}
              onTutor={setTutor}
              onCodeChange={setEditorCode}
              notify={notify}
            />
          ) : project ? (
            <ProjectWorkspace
              key={project.id}
              project={project}
              state={state}
              setState={setState}
              notify={notify}
              onBack={() => navigate("projects")}
            />
          ) : (
            <main className="main-content">
              {page === "overview" ? (
                <Dashboard
                  state={state}
                  name={name}
                  nextLesson={nextLesson}
                  complete={complete}
                  onLesson={openLesson}
                  navigate={navigate}
                  onProject={openProject}
                  setModal={setModal}
                />
              ) : page === "path" ? (
                <LearningPath
                  initialCourse={selectedCourse || state.activeCourse}
                  state={state}
                  onLesson={openLesson}
                  setModal={setModal}
                />
              ) : page === "challenges" ? (
                <ChallengePage
                  state={state}
                  onLesson={openLesson}
                  setModal={setModal}
                />
              ) : page === "projects" ? (
                <ProjectsPage state={state} onProject={openProject} />
              ) : page === "playground" ? (
                <Playground notify={notify} />
              ) : page === "review" ? (
                <ReviewQueue state={state} onLesson={openLesson} />
              ) : page === "achievements" ? (
                <Achievements state={state} />
              ) : (
                <Insights state={state} onLesson={openLesson} />
              )}
              <footer className="page-footer">
                <span>
                  <Brand small />
                  Made for the journey. Not just the destination.
                </span>
                <span>
                  One line at a time.{" "}
                  <span className="blue-text">You’ve got this.</span>
                </span>
              </footer>
            </main>
          )}
        </Suspense>
      </div>
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <Icon
            name={
              toast.type === "error"
                ? "alert"
                : toast.type === "info"
                  ? "lightbulb"
                  : "success"
            }
            size={18}
          />
          {toast.message}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {modal?.type === "search" && (
        <SearchModal
          state={state}
          onClose={() => setModal(null)}
          onLesson={openLesson}
          setModal={setModal}
        />
      )}
      {modal?.type === "settings" && (
        <SettingsModal
          state={state}
          setState={setState}
          notify={notify}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "account" && (
        <AccountModal
          user={user}
          load={load}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal?.type === "courseComplete" && (
        <Modal
          title="That’s a foundation you built."
          subtitle={`${modal.course.name} · ${modal.course.lessons.length} real coding lessons completed`}
          onClose={() => setModal(null)}
        >
          <div className="course-finish">
            <LanguageIcon name={modal.course.icon} />
            <h3>From reading code to writing it.</h3>
            <p>
              Your completed lessons, earned XP, and independent review schedule
              are saved. A finished course is a starting point—not a promise
              that you’ve mastered every topic.
            </p>
            <div className="course-finish-stats">
              <span>
                <Icon name="success" size={16} />
                {modal.course.lessons.length} lessons passed
              </span>
              <span>
                <Icon name="zap" size={16} />
                {modal.course.lessons.reduce((n, l) => n + l.xp, 0)} course XP
              </span>
            </div>
          </div>
          <div className="course-finish-actions">
            <button
              className="button secondary full"
              onClick={() => {
                setModal(null);
                navigate("review");
              }}
            >
              Practice recall <Icon name="reset" size={15} />
            </button>
            {courses
              .filter((c) => c.id !== modal.course.id)
              .map((c) => (
                <button
                  className="button primary full"
                  key={c.id}
                  onClick={() =>
                    openLesson(
                      c.lessons.find((l) => !state.completed.includes(l.id)) ||
                        c.lessons[0],
                    )
                  }
                >
                  Explore {c.name}
                  <Icon name="arrow" size={15} />
                </button>
              ))}
          </div>
        </Modal>
      )}
      {modal?.type === "planned" && (
        <Modal
          title={modal.item.name}
          subtitle="A destination on your developer roadmap."
          onClose={() => setModal(null)}
        >
          <Pill color="purple">CURRICULUM PLANNED</Pill>
          <p className="modal-copy">
            This course is on the roadmap, but its interactive lessons are not
            available yet. Python and JavaScript foundations are ready to learn
            today.
          </p>
          <div className="planned-topics">
            {modal.item.topics?.map((t, i) => (
              <div key={t}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {t}
                <Icon name="lock" size={13} />
              </div>
            ))}
          </div>
          <button
            className="button primary full"
            onClick={() => {
              setModal(null);
              navigate("path");
            }}
          >
            Explore the learning path <Icon name="arrow" size={16} />
          </button>
        </Modal>
      )}
      {modal?.type === "activity" && (
        <Modal
          title="Every little step counts."
          subtitle="Your recent learning activity. Missed days never take your progress away."
          onClose={() => setModal(null)}
        >
          {state.activity.length ? (
            state.activity.slice(0, 8).map((a, i) => (
              <div className="activity-item" key={i}>
                <span className="activity-icon">
                  <Icon name="check" size={17} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <small>
                    {new Date(a.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · Completed
                  </small>
                </div>
                <span className="xp">+{a.xp} XP</span>
              </div>
            ))
          ) : (
            <Empty icon="flame" title="A fresh start is a good start.">
              Finish your first coding exercise to begin your activity timeline.
            </Empty>
          )}
        </Modal>
      )}
      {modal?.type === "help" && (
        <Modal
          title="You don’t have to know it all."
          subtitle="You just have to take the next step."
          onClose={() => setModal(null)}
        >
          <div className="help-steps">
            {[
              [
                "book",
                "Read & understand",
                "Start with a plain-English explanation and see what every symbol means.",
              ],
              [
                "code",
                "Write & experiment",
                "Change the code, run it, and make a prediction. Mistakes are useful information.",
              ],
              [
                "tests",
                "Prove it to yourself",
                "Submit your code against real tests. XP comes from correct solutions, not clicks.",
              ],
              [
                "reset",
                "Come back to it",
                "Practice again from memory. You keep your progress, even when life gets busy.",
              ],
            ].map(([icon, title, desc]) => (
              <div key={title}>
                <Icon name={icon} />
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            className="button primary full"
            onClick={() => openLesson(nextLesson)}
          >
            Take my next step <Icon name="arrow" size={16} />
          </button>
        </Modal>
      )}
      {tutor && (
        <TutorDrawer
          context={tutor}
          configured={tutorConfigured}
          onClose={() => setTutor(null)}
        />
      )}
    </div>
  );
}
function Dashboard({
  state,
  name,
  nextLesson,
  complete,
  onLesson,
  navigate,
  onProject,
  setModal,
}) {
  const [courseTab, setCourseTab] = useState("Your path");
  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = state.activity.filter((a) => a.date.startsWith(today));
  const todayXP = todayActivity.reduce((s, a) => s + a.xp, 0);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const iso = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("en", { weekday: "narrow" }),
      date: iso,
      active: state.goalDays.includes(iso),
      today: iso === today,
    };
  });
  return (
    <div className="dashboard">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="blue-dash" />
            YOUR DEVELOPER JOURNEY
          </div>
          <h1>
            {complete
              ? `Welcome back, ${name}.`
              : "Big things start with a little code."}
            <span className="heading-dot">_</span>
          </h1>
          <p>
            {complete
              ? "You’re building something more important than software. Your skills."
              : "You don’t need to know everything. Just take the next step."}
          </p>
        </div>
        <button
          className="session-button"
          onClick={() => setModal({ type: "settings" })}
        >
          <Icon name="clock" size={16} />
          <span>{state.settings.dailyMinutes} min / day</span>
          <Icon name="down" size={14} />
        </button>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          <section className="continue-card">
            <div className="hero-grid-pattern" />
            <div className="continue-copy">
              <div className="hero-eyebrow">
                <span className="live-dot" />
                {complete ? "KEEP YOUR MOMENTUM" : "YOUR FIRST CHAPTER"}
                <span className="hero-chapter">
                  {String(courseForLesson(nextLesson).chapter).padStart(2, "0")}{" "}
                  / {paths.length}
                </span>
              </div>
              <h2>
                From “where do I start?”
                <br />
                to <span>“I built this.”</span>
              </h2>
              <p>
                Learn to think like a developer.
                <br />
                One concept, one challenge, one small win at a time.
              </p>
              <div className="hero-course">
                <LanguageIcon
                  name={courseForLesson(nextLesson).icon}
                  size="small"
                />
                <span>
                  {courseForLesson(nextLesson).name}
                  <span className="hero-course-divider">/</span>
                  <span className="muted">{nextLesson.concept}</span>
                </span>
              </div>
              <button
                className="button primary hero-button"
                onClick={() => onLesson(nextLesson)}
              >
                {complete ? "Continue learning" : "Start learning"}
                <Icon name="arrow" size={17} />
              </button>
              <div className="hero-note">
                <Icon name="clock" size={13} /> {nextLesson.duration}-minute
                lesson <span>·</span> No experience needed
              </div>
            </div>
            <HeroArt />
          </section>
          <div className="stats-strip">
            <div>
              <span className="stat-icon blue">
                <Icon name="book" size={19} />
              </span>
              <div>
                <span className="stat-value">
                  {complete}
                  <span> / {orderedLessons.length}</span>
                </span>
                <small>Lessons completed</small>
              </div>
            </div>
            <div>
              <span className="stat-icon purple">
                <Icon name="code" size={19} />
              </span>
              <div>
                <span className="stat-value">
                  {
                    state.completed.filter((id) =>
                      challenges.some((c) => c.id === id),
                    ).length
                  }
                </span>
                <small>Challenges solved</small>
              </div>
            </div>
            <div>
              <span className="stat-icon mint">
                <Icon name="target" size={19} />
              </span>
              <div>
                <span className="stat-value">
                  {
                    reviewQueue(state).filter(
                      (r) => r.stage >= 3 && !r.needsPractice,
                    ).length
                  }
                </span>
                <small>Skills retained</small>
              </div>
            </div>
            <div>
              <span className="stat-icon orange">
                <Icon name="zap" size={19} />
              </span>
              <div>
                <span className="stat-value">
                  {state.xp}
                  <span> XP</span>
                </span>
                <small>Total experience</small>
              </div>
            </div>
          </div>
          {state.completed.length > 0 && (
            <RecommendationCard state={state} onLesson={onLesson} compact />
          )}
          <section className="path-section">
            <div className="section-title">
              <h2>Your next superpower</h2>
              <button className="text-button" onClick={() => navigate("path")}>
                View learning path <Icon name="arrow" size={15} />
              </button>
            </div>
            <div className="section-tabs">
              <div>
                {["Your path", "Explore courses"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCourseTab(t)}
                    className={courseTab === t ? "active" : ""}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span>
                <span className="tiny-blue-dot" />
                {courseTab === "Your path"
                  ? "A path, not a guessing game"
                  : "15 destinations. One big journey."}
              </span>
            </div>
            <div className="course-grid">
              {(courseTab === "Your path"
                ? [paths[0], paths[2], paths[3]]
                : [paths[4], paths[5], paths[11]]
              ).map((p, i) => (
                <button
                  className={`course-card ${p.available ? "current" : ""}`}
                  key={p.name}
                  onClick={() =>
                    p.available
                      ? navigate("path", p.courseId)
                      : setModal({ type: "planned", item: p })
                  }
                >
                  <div className="course-card-top">
                    <LanguageIcon name={p.icon} />
                    {p.available ? (
                      <Pill color="blue">
                        {courseProgress(state, p.courseId).completed ===
                        p.lessons
                          ? "COMPLETED"
                          : courseProgress(state, p.courseId).completed
                            ? "IN PROGRESS"
                            : "READY TO START"}
                      </Pill>
                    ) : (
                      <Icon name="lock" size={15} />
                    )}
                  </div>
                  <h3>{p.name}</h3>
                  <p>{p.sub}</p>
                  <div className="course-meta">
                    <span>
                      <Icon name="book" size={12} />
                      {p.available ? `${p.lessons} lessons` : "Planned course"}
                    </span>
                    <span>·</span>
                    <span>{p.available ? "Beginner" : "Coming later"}</span>
                  </div>
                  <div className="course-card-bottom">
                    <Progress
                      value={
                        p.available
                          ? courseProgress(state, p.courseId).percent
                          : 0
                      }
                    />
                    <div>
                      <span>
                        {p.available
                          ? `${courseProgress(state, p.courseId).completed} of ${p.lessons} completed`
                          : "Your future superpower"}
                      </span>
                      <span>
                        {p.available ? (
                          `${Math.round(courseProgress(state, p.courseId).percent)}%`
                        ) : (
                          <Icon name="lock" size={11} />
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="projects-section">
            <div className="section-title">
              <div>
                <h2>Less theory. More “I made that.”</h2>
                <p>Small projects. Real skills. Entirely yours.</p>
              </div>
              <button
                className="text-button"
                onClick={() => navigate("projects")}
              >
                All projects <Icon name="arrow" size={15} />
              </button>
            </div>
            <div className="mini-project-grid">
              <button
                className="mini-project"
                onClick={() => onProject(projects[0])}
              >
                <div className="project-thumb portfolio-thumb">
                  <div className="mini-browser">
                    <div className="browser-dots">
                      <i />
                      <i />
                      <i />
                    </div>
                    <span className="mini-eyebrow">HELLO, WORLD.</span>
                    <strong>
                      A little bit
                      <br />
                      of me.
                    </strong>
                    <div className="mini-lines">
                      <i />
                      <i />
                    </div>
                    <span className="mini-button">Let’s connect ↗</span>
                    <div className="mini-asterisk">✳</div>
                  </div>
                </div>
                <div className="mini-project-info">
                  <Pill color="mint">BEGINNER</Pill>
                  <h3>
                    Your first personal website <Icon name="up" size={16} />
                  </h3>
                  <p>
                    HTML <span>·</span> CSS <span>·</span> A little you
                  </p>
                </div>
              </button>
              <button
                className="mini-project"
                onClick={() => onProject(projects[1])}
              >
                <div className="project-thumb calculator-thumb">
                  <div className="mini-calculator">
                    <div>
                      24 <span>×</span> 7
                      <strong>
                        168<span>_</span>
                      </strong>
                    </div>
                    <section>
                      {["7", "8", "9", "÷", "4", "5", "6", "×"].map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </section>
                  </div>
                  <span className="floating-code">&lt;/&gt;</span>
                </div>
                <div className="mini-project-info">
                  <Pill color="blue">BEGINNER</Pill>
                  <h3>
                    Make Python do the math <Icon name="up" size={16} />
                  </h3>
                  <p>
                    Python <span>·</span> Functions <span>·</span> Logic
                  </p>
                </div>
              </button>
            </div>
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="daily-card">
            <div className="section-title">
              <h2>
                <Icon name="target" size={18} />
                Today’s small wins
              </h2>
              <Pill>
                {Number(
                  todayActivity.some((a) => lessons.some((l) => l.id === a.id)),
                ) +
                  Number(
                    todayActivity.some((a) =>
                      challenges.some((c) => c.id === a.id),
                    ),
                  ) +
                  Number(
                    Object.values(state.reviewed).some((d) =>
                      d.startsWith(today),
                    ),
                  )}
                /3
              </Pill>
            </div>
            <p>A little progress goes a long way.</p>
            <div className="daily-quests">
              {[
                {
                  title: "Write your first lines",
                  desc: "Complete a coding lesson",
                  xp: `+${state.completed.includes(nextLesson.id) ? 0 : nextLesson.xp} XP`,
                  done: todayActivity.some((a) =>
                    lessons.some((l) => l.id === a.id),
                  ),
                  action: () => onLesson(nextLesson),
                },
                {
                  title: "Put it into practice",
                  desc: "Solve an original challenge",
                  xp: "+100 XP",
                  done: todayActivity.some((a) =>
                    challenges.some((l) => l.id === a.id),
                  ),
                  action: () => navigate("challenges"),
                },
                {
                  title: "Make it stick",
                  desc: "Revisit something you learned",
                  xp: "REVIEW",
                  done: !!Object.values(state.reviewed).find((d) =>
                    d.startsWith(today),
                  ),
                  action: () =>
                    complete ? navigate("review") : onLesson(nextLesson),
                },
              ].map((q) => (
                <button
                  className="daily-quest"
                  key={q.title}
                  onClick={q.action}
                >
                  <span className={`quest-check ${q.done ? "done" : ""}`}>
                    {q.done && <Icon name="check" size={13} />}
                  </span>
                  <span>
                    <strong>{q.title}</strong>
                    <small>{q.desc}</small>
                  </span>
                  <span
                    className={`quest-xp ${q.xp === "REVIEW" ? "review" : ""}`}
                  >
                    {q.xp}
                  </span>
                </button>
              ))}
            </div>
            <div className="daily-goal">
              <div>
                <span>Daily XP goal</span>
                <strong>
                  {todayXP} <span>/ 100 XP</span>
                </strong>
              </div>
              <Progress value={todayXP} />
              <small>No pressure. Every bit counts.</small>
            </div>
          </section>
          <section className="consistency-card">
            <div className="section-title">
              <h2>
                <Icon name="flame" size={18} />
                Show up for yourself
              </h2>
            </div>
            <div className="streak-number">
              {state.goalDays.length}
              <span>
                learning {state.goalDays.length === 1 ? "day" : "days"}
                <small>
                  {state.goalDays.length
                    ? "You’re making this a habit."
                    : "Your first day is a fresh start."}
                </small>
              </span>
              <Icon name="flame" size={39} />
            </div>
            <div className="week-days">
              {week.map((d, i) => (
                <div key={i} className={d.today ? "today" : ""}>
                  <span>{d.day}</span>
                  <div className={d.active ? "day-active" : ""}>
                    {d.active ? (
                      <Icon name="check" size={14} />
                    ) : d.today ? (
                      <span />
                    ) : (
                      <i />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="kind-note">
              <Icon name="sprout" size={15} />
              <span>Life happens. Your progress stays.</span>
            </div>
          </section>
          <button
            className="challenge-promo"
            onClick={() => navigate("challenges")}
          >
            <div className="challenge-art">
              <Icon name="swords" size={42} />
              <span className="challenge-star a">✦</span>
              <span className="challenge-star b">✧</span>
            </div>
            <Pill color="purple">THE PRACTICE ARENA</Pill>
            <h3>
              Meet your next
              <br />
              “aha!” moment.
            </h3>
            <p>
              Little puzzles that turn what
              <br />
              you know into what you can do.
            </p>
            <span className="promo-link">
              Explore challenges <Icon name="arrow" size={16} />
            </span>
          </button>
          <div className="quote-card">
            <span>“</span>
            <p>
              The expert in anything
              <br />
              was once a beginner.
            </p>
            <div>YOUR FRIENDLY REMINDER</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
function LearningPath({ state, onLesson, setModal, initialCourse }) {
  const [expanded, setExpanded] = useState(
    Math.max(
      0,
      paths.findIndex((p) => p.courseId === initialCourse),
    ),
  );
  const [query, setQuery] = useState("");
  const complete = orderedLessons.filter((l) =>
    state.completed.includes(l.id),
  ).length;
  return (
    <div className="path-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            FROM YOUR FIRST LINE TO YOUR NEXT BIG IDEA
          </div>
          <h1>A path with purpose.</h1>
          <p>
            Build the foundation. Connect the dots. Make something that’s yours.
          </p>
        </div>
        <Pill color="blue">
          <Icon name="route" size={14} />
          15 learning chapters
        </Pill>
      </div>
      <div className="path-summary">
        <span className="path-summary-icon">
          <Icon name="route" size={28} />
        </span>
        <div>
          <strong>Your developer journey</strong>
          <p>
            {complete} of {orderedLessons.length} available lessons completed ·
            Advanced chapters are planned
          </p>
        </div>
        <div>
          <span>
            {Math.round((complete / orderedLessons.length) * 100)}%{" "}
            <small>of available lessons</small>
          </span>
          <Progress value={(complete / orderedLessons.length) * 100} />
        </div>
      </div>
      <div className="path-content">
        <div className="roadmap-list">
          {paths
            .filter(
              (p) =>
                !query ||
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.topics.some((t) =>
                  t.toLowerCase().includes(query.toLowerCase()),
                ),
            )
            .map((p, i) => (
              <section
                className={`roadmap-chapter ${p.available ? "available" : ""} ${expanded === paths.indexOf(p) ? "expanded" : ""}`}
                key={p.name}
              >
                <div className="roadmap-line" />
                <span
                  className={`chapter-number ${p.available ? "current" : ""}`}
                >
                  {p.available ? (
                    <Icon name="code" size={18} />
                  ) : (
                    String(paths.indexOf(p) + 1).padStart(2, "0")
                  )}
                </span>
                <button
                  className="chapter-heading"
                  onClick={() =>
                    setExpanded(
                      expanded === paths.indexOf(p) ? -1 : paths.indexOf(p),
                    )
                  }
                >
                  <LanguageIcon name={p.icon} />
                  <div>
                    <div className="chapter-label">
                      CHAPTER {String(paths.indexOf(p) + 1).padStart(2, "0")}
                      {p.available && <Pill color="blue">AVAILABLE NOW</Pill>}
                    </div>
                    <h2>{p.name}</h2>
                    <p>{p.sub}</p>
                  </div>
                  <div className="chapter-status">
                    {p.available ? (
                      <span>
                        {courseProgress(state, p.courseId).completed}/
                        {p.lessons} lessons
                      </span>
                    ) : (
                      <span>
                        <Icon name="lock" size={13} />
                        Planned
                      </span>
                    )}
                    <Icon
                      name={expanded === paths.indexOf(p) ? "down" : "chevron"}
                      size={18}
                    />
                  </div>
                </button>
                {expanded === paths.indexOf(p) && (
                  <div className="chapter-content">
                    {p.courseId === "javascript" && (
                      <p className="course-scope-note">
                        <Icon name="braces" size={15} />
                        An independent beginner track. Start here or follow
                        Python first. These lessons teach the language; DOM,
                        Fetch, and frameworks come later.
                      </p>
                    )}
                    {p.available ? (
                      lessonsForCourse(p.courseId).map((l, idx) => {
                        const done = state.completed.includes(l.id);
                        const locked = prerequisitesFor(l).some(
                          (id) => !state.completed.includes(id),
                        );
                        return (
                          <button
                            className={`lesson-row ${done ? "completed" : ""} ${locked ? "locked" : ""}`}
                            key={l.id}
                            onClick={() => onLesson(l)}
                          >
                            <span className="lesson-order">
                              {done ? (
                                <Icon name="check" size={15} />
                              ) : locked ? (
                                <Icon name="lock" size={14} />
                              ) : (
                                <Icon name="play" size={14} />
                              )}
                            </span>
                            <div>
                              <strong>{l.title}</strong>
                              <small>{l.concept}</small>
                            </div>
                            <span className="lesson-duration">
                              {l.duration} min
                            </span>
                            <span className="xp">{l.xp} XP</span>
                            <Icon name="chevron" size={15} />
                          </button>
                        );
                      })
                    ) : (
                      <>
                        <p className="planned-notice">
                          <Icon name="clock" size={15} />
                          This chapter is on the roadmap. Interactive lessons
                          are still to come.
                        </p>
                        <div className="topic-tags">
                          {p.topics.map((t) => (
                            <Pill key={t}>{t}</Pill>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            ))}
        </div>
        <aside className="path-sidebar">
          <div className="search-box">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a topic…"
              aria-label="Find a roadmap topic"
            />
          </div>
          <div className="path-guidance">
            <Icon name="compass" size={28} />
            <h3>There’s no rush.</h3>
            <p>
              This is a roadmap, not a race. Each new concept builds on what you
              already understand.
            </p>
            <div>
              <Icon name="check" size={16} />
              Learn through actual code
            </div>
            <div>
              <Icon name="check" size={16} />
              Unlock skills by doing
            </div>
            <div>
              <Icon name="check" size={16} />
              Review at your own pace
            </div>
          </div>
          <div className="path-modes">
            <span className="eyebrow">SIX WAYS TO GROW</span>
            {[
              ["book", "Learn", "Understand a new idea"],
              ["code", "Practice", "Get comfortable writing it"],
              ["swords", "Challenge", "Put your skills to the test"],
              ["bug", "Debug", "Learn by fixing a mistake"],
              ["folder", "Build", "Turn ideas into real projects"],
              ["exam", "Exam", "Prove it, independently"],
            ].map(([icon, title, desc]) => (
              <div key={title}>
                <Icon name={icon} size={17} />
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
function ChallengePage({ state, onLesson, setModal }) {
  const [difficulty, setDifficulty] = useState("All difficulties");
  const [language, setLanguage] = useState("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All problems");
  const solved = challenges.filter((c) =>
    state.completed.includes(c.id),
  ).length;
  const list = challenges.filter(
    (c) =>
      (difficulty === "All difficulties" || c.difficulty === difficulty) &&
      (language === "all" || c.language === language) &&
      (!query ||
        `${c.title} ${c.concept}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (status === "All problems" ||
        (status === "Solved"
          ? state.completed.includes(c.id)
          : !state.completed.includes(c.id))),
  );
  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE PRACTICE ARENA</div>
          <h1>Less memorizing. More problem-solving.</h1>
          <p>
            Original challenges that turn “I understand” into “I can do this.”
          </p>
        </div>
        <span className="page-emblem purple">
          <Icon name="swords" size={32} />
        </span>
      </div>
      <div className="challenge-banner">
        <div>
          <Pill color="purple">YOUR TRAINING GROUND</Pill>
          <h2>
            Good thinking is a skill.
            <br />
            Let’s practice it.
          </h2>
          <p>Small hints when you need them. Real tests when you’re ready.</p>
        </div>
        <div className="challenge-progress">
          <strong>
            {solved}
            <span>/ {challenges.filter((c) => !c.planned).length}</span>
          </strong>
          <p>available challenges solved</p>
          <Progress
            value={(solved / challenges.filter((c) => !c.planned).length) * 100}
            color="purple"
          />
        </div>
        <Icon className="banner-swords" name="swords" size={110} />
      </div>
      <div className="boss-callout">
        <span className="boss-emblem">
          <Icon name="swords" size={26} />
        </span>
        <div>
          <div className="eyebrow">YOUR FIRST REAL-WORLD BOSS BATTLE</div>
          <h3>The supply station needs a developer.</h3>
          <p>
            Combine loops, dictionaries, JSON, and validation into a working
            inventory function.
          </p>
        </div>
        <button
          className="button secondary small"
          onClick={() =>
            onLesson(
              challenges.find((c) => c.boss),
              "practice",
            )
          }
        >
          {state.completed.includes("error-handling")
            ? "Enter the station"
            : "Unlock with Python"}
          <Icon
            name={state.completed.includes("error-handling") ? "arrow" : "lock"}
            size={14}
          />
        </button>
      </div>
      <div className="filters">
        <select
          aria-label="Challenge language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="all">All languages</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search challenges or concepts…"
            aria-label="Search challenges"
          />
        </div>
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {[
            "All difficulties",
            "Beginner",
            "Easy",
            "Medium",
            "Hard",
            "Expert",
          ].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          aria-label="Completion status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["All problems", "Solved", "Unsolved"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="challenge-table">
        <div className="challenge-table-head">
          <span>STATUS</span>
          <span>CHALLENGE</span>
          <span>DIFFICULTY</span>
          <span>REWARD</span>
          <span />
        </div>
        {list.length ? (
          list.map((c) => {
            const locked = c.requires.some((r) => !state.completed.includes(r));
            const done = state.completed.includes(c.id);
            return (
              <button
                className="challenge-table-row"
                key={c.id}
                onClick={() =>
                  c.planned
                    ? setModal({
                        type: "planned",
                        item: {
                          name: c.title,
                          topics: [
                            c.concept,
                            "Prerequisite lessons",
                            "Visible and hidden tests",
                            "Solution walkthrough",
                          ],
                        },
                      })
                    : onLesson(c, "practice")
                }
              >
                <span className={done ? "mint-text" : "muted"}>
                  <Icon
                    name={done ? "success" : locked ? "lock" : "circle"}
                    size={18}
                  />
                </span>
                <div>
                  <strong>
                    {c.title}
                    {c.planned && (
                      <span className="table-planned">PLANNED</span>
                    )}
                  </strong>
                  <small>
                    {c.concept}
                    {locked &&
                      !c.planned &&
                      " · Complete prerequisite lessons to unlock"}
                  </small>
                </div>
                <span>
                  <Pill
                    color={
                      c.difficulty === "Beginner" || c.difficulty === "Easy"
                        ? "mint"
                        : c.difficulty === "Medium"
                          ? "orange"
                          : "purple"
                    }
                  >
                    {c.difficulty}
                  </Pill>
                </span>
                <span className="xp">{c.xp} XP</span>
                <Icon name="chevron" size={16} />
              </button>
            );
          })
        ) : (
          <Empty icon="search" title="No challenges match.">
            Try a different concept or difficulty.
          </Empty>
        )}
      </div>
      <div className="ethics-note">
        <Icon name="shield" size={19} />
        <div>
          <strong>Built for understanding, not competition.</strong>
          <p>
            Challenges unlock after their prerequisites. Take as many attempts
            as you need. These are personal practice results, not a verified
            leaderboard.
          </p>
        </div>
      </div>
    </div>
  );
}
function ProjectsPage({ state, onProject }) {
  const [filter, setFilter] = useState("All projects");
  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BUILD SOMETHING THAT’S YOURS</div>
          <h1>This is where it comes together.</h1>
          <p>
            Go from following along to figuring it out. One real project at a
            time.
          </p>
        </div>
        <Icon name="folder" size={34} className="blue-text" />
      </div>
      <div className="project-filter">
        {["All projects", "Beginner", "Intermediate", "Advanced"].map((t) => (
          <button
            key={t}
            className={filter === t ? "active" : ""}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="full-project-grid">
        {projects
          .filter((p) => filter === "All projects" || p.level === filter)
          .map((p) => (
            <button
              className={`full-project-card ${p.color}`}
              key={p.id}
              onClick={() => onProject(p)}
            >
              <div className="full-project-art">
                <div className="project-art-orbit" />
                <Icon
                  name={
                    p.id === "portfolio"
                      ? "globe"
                      : p.id === "calculator"
                        ? "braces"
                        : p.id === "todo"
                          ? "tests"
                          : "layers"
                  }
                  size={55}
                />
                <span className="art-code top">
                  {p.language === "python" ? "def build():" : "<your-idea />"}
                </span>
                <span className="art-code bottom">
                  {p.available ? "made by you." : "your next chapter."}
                </span>
                <Pill>
                  {p.available
                    ? state.projects[p.id]
                      ? "IN PROGRESS"
                      : "GUIDED PROJECT"
                    : "PLANNED PROJECT"}
                </Pill>
              </div>
              <div className="full-project-content">
                <div>
                  <Pill color={p.color}>{p.level}</Pill>
                  <span>
                    <Icon name="clock" size={13} />
                    {p.time}
                  </span>
                </div>
                <h2>{p.type}</h2>
                <p>{p.description}</p>
                <div className="project-card-footer">
                  <span>
                    {p.available
                      ? p.requires.some((r) => !state.completed.includes(r))
                        ? "Unlock after Functions"
                        : state.projects[p.id]
                          ? "Continue building"
                          : "Open workspace"
                      : "On the roadmap"}
                  </span>
                  <Icon name={p.available ? "arrow" : "lock"} size={17} />
                </div>
              </div>
            </button>
          ))}
      </div>
      <div className="ethics-note">
        <Icon name="lightbulb" size={20} />
        <div>
          <strong>The scaffolding comes off, a little at a time.</strong>
          <p>
            Start with guided templates. Change things, see what happens, and
            export your work. Independent, tested projects are the long-term
            goal.
          </p>
        </div>
      </div>
    </div>
  );
}
function isEarned(b, state) {
  const count = (
    b.courseId ? lessonsForCourse(b.courseId) : orderedLessons
  ).filter((l) => state.completed.includes(l.id)).length;
  return b.id === "supply-station"
    ? state.completed.includes("inventory-boss")
    : b.id === "first-challenge"
      ? challenges.some((c) => state.completed.includes(c.id))
      : b.id === "independent"
        ? state.examPassed.length > 0
        : count >= b.need;
}
function Achievements({ state }) {
  const earned = badges.filter((b) => isEarned(b, state)).length;
  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PROOF OF THE WORK YOU PUT IN</div>
          <h1>Small wins. Lasting skills.</h1>
          <p>No participation trophies. Just milestones you really earned.</p>
        </div>
        <Pill color="orange">
          <Icon name="trophy" size={14} />
          {earned} of {badges.length} earned
        </Pill>
      </div>
      <div className="achievement-hero">
        <div className="large-gem">
          <Icon name="gem" size={54} />
        </div>
        <div>
          <span className="eyebrow">YOUR CURRENT RANK</span>
          <h2>
            {Math.floor(state.xp / 250) + 1 < 3
              ? "Code apprentice"
              : "Code explorer"}
          </h2>
          <p>
            Level {Math.floor(state.xp / 250) + 1} · {state.xp} total XP earned
            through correct solutions
          </p>
          <Progress value={((state.xp % 250) / 250) * 100} />
          <small>{250 - (state.xp % 250)} XP to your next level</small>
        </div>
        <div className="rank-quote">
          Not just a badge.
          <br />
          <span>A little proof you can.</span>
        </div>
      </div>
      <h2 className="subheading">Your achievement collection</h2>
      <div className="badge-grid">
        {badges.map((b) => {
          const earned = isEarned(b, state);
          return (
            <div className={`badge-card ${earned ? "earned" : ""}`} key={b.id}>
              <div className="badge-symbol">
                <Icon name={b.icon} size={38} />
                {!earned && (
                  <span>
                    <Icon name="lock" size={12} />
                  </span>
                )}
              </div>
              <h3>{b.name}</h3>
              <p>{b.desc}</p>
              <Pill color={earned ? "mint" : ""}>
                {earned ? "EARNED" : "KEEP GROWING"}
              </Pill>
            </div>
          );
        })}
      </div>
      <div className="ethics-note">
        <Icon name="shield" size={19} />
        <div>
          <strong>Your pace is the right pace.</strong>
          <p>
            Badges never expire. Missed days never subtract XP. Reviewing an
            exercise reinforces your skill without farming extra rewards.
          </p>
        </div>
      </div>
    </div>
  );
}
function Insights({ state, onLesson }) {
  const skills = Object.entries(state.skills);
  const attempts = skills.reduce((n, [, s]) => n + s.attempts, 0);
  const passed = skills.reduce((n, [, s]) => n + s.passed, 0);
  const time = skills.reduce((n, [, s]) => n + s.time, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      xp: state.activity
        .filter((a) => a.date.startsWith(d.toISOString().slice(0, 10)))
        .reduce((n, a) => n + a.xp, 0),
    };
  });
  const due = reviewQueue(state)
    .filter((r) => r.due || r.needsPractice)
    .map((r) => ({ ...r.lesson, recovery: r.needsPractice }));
  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">GET TO KNOW YOUR OWN PROGRESS</div>
          <h1>Look how far you’re going.</h1>
          <p>
            Useful feedback, not a report card. Find your strengths and your
            next step.
          </p>
        </div>
        <Pill>PERSONAL INSIGHTS</Pill>
      </div>
      <div className="insight-stats">
        {[
          ["tests", attempts, "Total submissions"],
          [
            "target",
            attempts ? Math.round((passed / attempts) * 100) + "%" : "—",
            "Submission accuracy",
          ],
          ["clock", Math.round(time / 60) + " min", "Recorded practice time"],
          [
            "lightbulb",
            Object.values(state.hints).reduce((a, b) => a + b, 0),
            "Hints explored",
          ],
        ].map(([icon, value, label]) => (
          <div key={label}>
            <Icon name={icon} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="insights-grid">
        <section className="insights-card">
          <div className="section-title">
            <h2>A week of little steps</h2>
            <Pill>LAST 7 DAYS</Pill>
          </div>
          <div className="bar-chart">
            {days.map((d, i) => (
              <div key={i}>
                <span>{d.xp} XP</span>
                <div>
                  <i
                    style={{
                      height: `${Math.max(2, (d.xp / Math.max(100, ...days.map((x) => x.xp))) * 100)}%`,
                    }}
                  />
                </div>
                <span>{d.day}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="insights-card">
          <div className="section-title">
            <h2>Keep it fresh</h2>
            <Icon name="reset" size={18} />
          </div>
          <p className="muted">
            Start with a recall check, then revisit the concept after a day. A
            little retrieval practice makes knowledge stick.
          </p>
          {due.length ? (
            due.slice(0, 3).map((l) => (
              <button
                className="review-row"
                key={l.id}
                onClick={() => onLesson(l, l.recovery ? "practice" : "exam")}
              >
                <Icon name="book" />
                <div>
                  <strong>{l.concept}</strong>
                  <small>
                    {l.recovery ? "Warm up with hints" : "Try it from memory"}
                  </small>
                </div>
                <Icon name="arrow" size={16} />
              </button>
            ))
          ) : (
            <Empty icon="book" title="Your review queue is clear.">
              Complete a lesson to start building your knowledge map.
            </Empty>
          )}
        </section>
      </div>
      <section className="insights-card skill-table">
        <h2>Your skills, in focus</h2>
        {skills.length ? (
          <>
            <div className="skill-table-head">
              <span>CONCEPT</span>
              <span>ATTEMPTS</span>
              <span>ACCURACY</span>
              <span>STATUS</span>
            </div>
            {skills.map(([name, s]) => (
              <div className="skill-row" key={name}>
                <strong>{name}</strong>
                <span>{s.attempts}</span>
                <span>{Math.round((s.passed / s.attempts) * 100)}%</span>
                <Pill
                  color={
                    reviewQueue(state).some(
                      (r) =>
                        r.lesson.concept === name &&
                        r.stage >= 3 &&
                        !r.needsPractice,
                    )
                      ? "mint"
                      : "blue"
                  }
                >
                  {reviewQueue(state).find((r) => r.lesson.concept === name)
                    ?.status || (s.passed ? "Introduced" : "Practicing")}
                </Pill>
              </div>
            ))}
          </>
        ) : (
          <Empty icon="trending" title="Your story hasn’t been written yet.">
            Submit your first exercise to begin tracking attempts, accuracy, and
            the concepts you’ve practiced.
          </Empty>
        )}
      </section>
    </div>
  );
}
function SearchModal({ onClose, onLesson, setModal, state }) {
  const [query, setQuery] = useState("");
  const lessonResults = orderedLessons.filter((l) =>
    `${l.title} ${l.concept}`.toLowerCase().includes(query.toLowerCase()),
  );
  const courseResults = paths.filter((p) =>
    `${p.name} ${p.topics.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Modal
      title="Find your next skill"
      subtitle="Search lessons, languages, and the full developer roadmap."
      onClose={onClose}
      wide
    >
      <div className="search-box modal-search">
        <Icon name="search" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try Python, variables, React, or databases…"
        />
      </div>
      <div className="search-results">
        <span className="eyebrow">INTERACTIVE LESSONS</span>
        {lessonResults.length ? (
          lessonResults.map((l) => (
            <button key={l.id} onClick={() => onLesson(l)}>
              <Icon name="file" size={18} />
              <div>
                <strong>{l.title}</strong>
                <small>
                  {l.concept} · {l.duration} min
                </small>
              </div>
              <Icon name="arrow" size={16} />
            </button>
          ))
        ) : (
          <p className="muted">No matching lessons.</p>
        )}
        <span className="eyebrow">ON THE LEARNING ROADMAP</span>
        {courseResults.slice(0, 8).map((p) => (
          <button
            key={p.name}
            onClick={() =>
              p.available
                ? onLesson(
                    lessonsForCourse(p.courseId).find(
                      (l) => !state.completed.includes(l.id),
                    ) || lessonsForCourse(p.courseId)[0],
                  )
                : setModal({ type: "planned", item: p })
            }
          >
            <LanguageIcon name={p.icon} size="small" />
            <div>
              <strong>{p.name}</strong>
              <small>
                {p.available ? "Available now" : "Curriculum planned"}
              </small>
            </div>
            <Icon name={p.available ? "arrow" : "lock"} size={15} />
          </button>
        ))}
      </div>
    </Modal>
  );
}
function SettingsModal({ state, setState, notify, onClose }) {
  const [name, setName] = useState(state.settings.name);
  const [minutes, setMinutes] = useState(state.settings.dailyMinutes);
  const [sound, setSound] = useState(state.settings.sound);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      const s = await api(
        "state",
        { settings: { name, dailyMinutes: minutes, sound } },
        "PATCH",
      );
      setState(s);
      notify("Your learning space, your rules. Settings saved.");
      onClose();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      title="Make yourself at home."
      subtitle="A learning routine that fits your life."
      onClose={onClose}
    >
      <div className="settings-form">
        <label>
          What should we call you?
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
        </label>
        <label>
          Your daily learning time <span>{minutes} minutes</span>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
          <small>
            A suggestion, never a limit. You can always keep practicing.
          </small>
        </label>
        <div className="setting-row">
          <span className="setting-icon">
            <Icon name={sound ? "sound" : "mute"} size={22} />
          </span>
          <div>
            <strong>A little celebration</strong>
            <p>Play a short sound when your solution passes.</p>
          </div>
          <button
            className={`toggle ${sound ? "on" : ""}`}
            role="switch"
            aria-checked={sound}
            aria-label="Celebration sounds"
            onClick={() => setSound(!sound)}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <span className="setting-icon">
            <Icon name="eye" size={22} />
          </span>
          <div>
            <strong>Midnight workspace</strong>
            <p>Calm contrast. A little electric blue. Easy on the eyes.</p>
          </div>
          <Pill color="blue">ACTIVE</Pill>
        </div>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button primary" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </Modal>
  );
}
function AccountModal({ user, load, onClose, notify }) {
  const [action, setAction] = useState("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("auth/" + action, { email, password, name });
      load();
      onClose();
      notify(
        action === "register"
          ? "Account created. Your existing progress is right here."
          : "Welcome back. Your progress is loaded.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal
      title={
        user?.email
          ? "Your learning account"
          : action === "register"
            ? "Give your progress a home."
            : "Welcome back, developer."
      }
      subtitle={
        user?.email
          ? "Your work is connected to this account."
          : "Guest progress is saved on this server. An account lets you return from another browser."
      }
      onClose={onClose}
    >
      {user?.email ? (
        <>
          <div className="account-details">
            <span className="avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
            </div>
            <Pill color="mint">CONNECTED</Pill>
          </div>
          <button
            className="button secondary full"
            onClick={async () => {
              await api("logout", {});
              load();
              onClose();
              notify("Signed out. Your account’s progress is safely saved.");
            }}
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </>
      ) : (
        <>
          <div className="auth-tabs">
            <button
              className={action === "register" ? "active" : ""}
              onClick={() => setAction("register")}
            >
              Create account
            </button>
            <button
              className={action === "login" ? "active" : ""}
              onClick={() => setAction("login")}
            >
              Sign in
            </button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {action === "register" && (
              <label>
                Your name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder="Ada"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                minLength={10}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  action === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 10 characters"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="button primary full" disabled={loading}>
              {loading
                ? "One moment…"
                : action === "register"
                  ? "Create my account"
                  : "Sign in"}
              <Icon name="arrow" size={16} />
            </button>
            <p className="auth-note">
              <Icon name="shield" size={13} />
              Passwords are hashed. Your code is never executed on the server.
            </p>
          </form>
        </>
      )}
    </Modal>
  );
}
function TutorDrawer({ context, configured, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lesson =
    [...lessons, ...challenges].find(
      (l) => l.id === context.lesson && l.hints,
    ) || lessons[0];
  useEffect(() => {
    api("tutor")
      .then((rows) =>
        setMessages(
          rows.reverse().map((r) => ({ role: r.role, content: r.message })),
        ),
      )
      .catch(() => {});
  }, []);
  async function send(message = input) {
    if (!message.trim() || loading) return;
    setInput("");
    setLoading(true);
    setError("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    try {
      const response = await api("tutor", {
        message,
        lesson: context.lesson,
        code: context.code,
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: response.reply },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="tutor-scrim" onClick={onClose} />
      <aside className="tutor-drawer">
        <div className="tutor-header">
          <span className="tutor-logo">
            <Icon name="sparkles" size={23} />
          </span>
          <div>
            <h2>Your coding companion</h2>
            <span>
              <span className="green-dot" />
              {configured
                ? "AI-powered tutor"
                : "Guided mode · no AI provider connected"}
            </span>
          </div>
          <button
            className="icon-button"
            aria-label="Close tutor"
            onClick={onClose}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="tutor-context">
          <Icon name="book" size={15} />
          <span>
            Learning: <strong>{lesson.concept}</strong>
          </span>
        </div>
        <div className="tutor-messages">
          <div className="tutor-intro">
            <Icon name="sparkles" size={27} />
            <h3>A nudge in the right direction.</h3>
            <p>
              {configured
                ? "I’ll help you understand your code, not take the keyboard away."
                : "This guided helper offers beginner explanations and lesson-specific hints. Connect an AI provider on the server for open-ended code analysis."}
            </p>
            <div className="suggestion-chips">
              {[
                "How should I approach this?",
                lesson.language === "javascript"
                  ? "Explain console.log vs return"
                  : "Explain print vs return",
                "Help me read an error",
              ].map((q) => (
                <button key={q} onClick={() => send(q)}>
                  {q}
                  <Icon name="arrow" size={13} />
                </button>
              ))}
            </div>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              {m.role === "assistant" && (
                <span>
                  <Icon name="sparkles" size={14} />
                </span>
              )}
              <p>{m.content}</p>
            </div>
          ))}
          {loading && (
            <div className="chat-typing">
              <Icon name="loading" className="spin" size={15} />
              Thinking through it with you…
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
        <form
          className="tutor-compose"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What’s on your mind?"
              aria-label="Message your tutor"
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="send-button"
              aria-label="Send message"
              disabled={loading || !input.trim()}
            >
              <Icon name="up" size={19} />
            </button>
          </div>
          <p>Understanding comes first. You’re in the driver’s seat.</p>
        </form>
      </aside>
    </>
  );
}
