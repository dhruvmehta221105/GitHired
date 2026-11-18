import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Circle,
  ExternalLink,
  Search,
  SlidersHorizontal
} from "lucide-react";
import API from "../api";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/useAuth";

const RECENCY_OPTIONS = [
  { value: "all", label: "Any recency" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "older", label: "Older questions" }
];

const DIFFICULTY_OPTIONS = ["All difficulties", "Easy", "Medium", "Hard"];
const PREVIEW_QUESTIONS = [
  {
    title: "Two Sum",
    company: "Amazon",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/two-sum"
  },
  {
    title: "Longest Substring Without Repeating Characters",
    company: "Google",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters"
  },
  {
    title: "Median of Two Sorted Arrays",
    company: "Microsoft",
    difficulty: "Hard",
    url: "https://leetcode.com/problems/median-of-two-sorted-arrays"
  }
];

export default function DsaPractice() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState(DIFFICULTY_OPTIONS[0]);
  const [recency, setRecency] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingQuestion, setSavingQuestion] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    API.get("/dsa-practice")
      .then(({ data }) => {
        if (active) setCompanies(data.companies || []);
      })
      .catch(() => {
        if (active) setError("We couldn't load the practice library. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return companies
      .map((company) => {
        const companyMatches = !query || company.name.toLowerCase().includes(query);
        const questions = company.questions.filter((question) => {
          const matchesQuestion =
            !query || companyMatches || question.title.toLowerCase().includes(query);
          const matchesDifficulty =
            difficulty === "All difficulties" || question.difficulty === difficulty;
          const matchesRecency = recency === "all" || question.recency === recency;
          return matchesQuestion && matchesDifficulty && matchesRecency;
        });

        return {
          ...company,
          questions
        };
      })
      .filter((company) => company.name.toLowerCase().includes(query) || company.questions.length > 0);
  }, [companies, difficulty, recency, search]);

  const toggleSolved = async (companySlug, question) => {
    const nextSolved = !question.solved;
    const key = `${companySlug}:${question.id}`;
    setSavingQuestion(key);
    setError("");
    setCompanies((current) =>
      current.map((company) =>
        company.slug !== companySlug
          ? company
          : {
              ...company,
              questions: company.questions.map((item) =>
                item.id === question.id ? { ...item, solved: nextSolved } : item
              )
            }
      )
    );

    try {
      await API.patch("/dsa-practice/progress", {
        companySlug,
        questionId: question.id,
        solved: nextSolved
      });
    } catch {
      setCompanies((current) =>
        current.map((company) =>
          company.slug !== companySlug
            ? company
            : {
                ...company,
                questions: company.questions.map((item) =>
                  item.id === question.id ? { ...item, solved: question.solved } : item
                )
              }
        )
      );
      setError("That progress update didn't save. Please try again.");
    } finally {
      setSavingQuestion(null);
    }
  };

  if (!user) return <DsaPracticePreview />;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-5 pb-16 pt-[112px] sm:px-8">
        <section className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.7px] text-accent">
            DSA Practice
          </p>
          <h1 className="text-4xl font-semibold tracking-[-1.5px] text-text sm:text-5xl">
            Prepare for the companies you care about.
          </h1>
          <p className="mt-4 text-base leading-7 text-text-secondary">
            Practice the LeetCode questions most often seen in company interviews, with your
            progress saved to your GitHired account.
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-border/70 bg-bg-card p-4 shadow-[0_8px_30px_rgba(17,17,17,0.04)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search companies or questions"
                className="w-full rounded-xl border border-border bg-bg px-11 py-3 text-sm text-text outline-none transition focus:border-accent/50 focus:ring-4 focus:ring-accent/10"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3">
              <SlidersHorizontal className="h-4 w-4 text-accent" />
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="bg-transparent py-3 text-sm text-text outline-none"
                aria-label="Filter by difficulty"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <select
              value={recency}
              onChange={(event) => setRecency(event.target.value)}
              className="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text outline-none focus:border-accent/50"
              aria-label="Filter by question recency"
            >
              {RECENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-bg-card px-6 py-16 text-center text-sm text-text-secondary">
            Loading your practice library...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg-card px-6 py-16 text-center">
            <p className="font-semibold text-text">No matching companies or questions</p>
            <p className="mt-2 text-sm text-text-secondary">
              Try a different search term or broaden your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCompanies.map((company) => {
              const isExpanded = expandedCompany === company.slug;
              const solvedCount = company.questions.filter((question) => question.solved).length;
              return (
                <section
                  key={company.slug}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-bg-card shadow-[0_8px_30px_rgba(17,17,17,0.035)]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCompany(isExpanded ? null : company.slug)}
                    className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-bg-secondary/60 sm:p-6"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-text">{company.name}</span>
                      <span className="mt-1 block text-xs text-text-secondary">
                        {company.questions.length} questions · {solvedCount} solved
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-text-secondary transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/70">
                      {company.questions.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-text-secondary">
                          No questions match the current filters.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-bg-secondary/70 text-xs uppercase tracking-[1px] text-text-secondary">
                              <tr>
                                <th className="w-20 px-5 py-4 font-semibold">#</th>
                                <th className="px-5 py-4 font-semibold">LeetCode Question</th>
                                <th className="px-5 py-4 font-semibold">Difficulty</th>
                                <th className="px-5 py-4 text-right font-semibold">Solve Link</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {company.questions.map((question, index) => {
                                const progressKey = `${company.slug}:${question.id}`;
                                const difficultyClass = {
                                  Easy: "bg-emerald-50 text-emerald-700",
                                  Medium: "bg-amber-50 text-amber-700",
                                  Hard: "bg-red-50 text-red-700"
                                }[question.difficulty] || "bg-bg-secondary text-text-secondary";
                                return (
                                  <tr key={`${company.slug}-${question.id}`} className="group hover:bg-bg-secondary/40">
                                    <td className="px-5 py-4 text-text-secondary">{index + 1}</td>
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => toggleSolved(company.slug, question)}
                                          disabled={savingQuestion === progressKey}
                                          className="shrink-0 text-accent transition hover:scale-110 disabled:opacity-50"
                                          aria-label={question.solved ? "Mark as unsolved" : "Mark as solved"}
                                        >
                                          {question.solved ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                          ) : (
                                            <Circle className="h-5 w-5 text-text-secondary" />
                                          )}
                                        </button>
                                        <span className={question.solved ? "text-text-secondary line-through" : "font-medium text-text"}>
                                          {question.title}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-4">
                                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyClass}`}>
                                        {question.difficulty}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <a
                                        href={question.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent-light"
                                      >
                                        Solve <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function DsaPracticePreview() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-[1080px] px-5 pb-16 pt-[120px] sm:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.7px] text-accent">
            DSA Practice
          </p>
          <h1 className="text-4xl font-semibold tracking-[-1.5px] text-text sm:text-5xl">
            Practice questions from top tech companies.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            Get a preview of the company-wise LeetCode questions available inside GitHired.
            Sign in to explore the complete library and track your progress.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="/signup"
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark"
            >
              Create a free account
            </a>
            <a
              href="/login"
              className="rounded-xl border border-border bg-bg-card px-5 py-3 text-sm font-semibold text-text transition hover:bg-bg-secondary"
            >
              Sign in
            </a>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-border/70 bg-bg-card shadow-[0_8px_30px_rgba(17,17,17,0.04)]">
          <div className="border-b border-border/70 bg-bg-secondary/60 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-text">A quick look inside</h2>
            <p className="mt-1 text-sm text-text-secondary">
              A few examples from the full company-wise question bank.
            </p>
          </div>
          <div className="divide-y divide-border/60">
            {PREVIEW_QUESTIONS.map((question) => {
              const difficultyClass = {
                Easy: "bg-emerald-50 text-emerald-700",
                Medium: "bg-amber-50 text-amber-700",
                Hard: "bg-red-50 text-red-700"
              }[question.difficulty];
              return (
                <div
                  key={question.title}
                  className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">{question.title}</p>
                      <p className="mt-1 text-xs text-text-secondary">{question.company}</p>
                    </div>
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyClass}`}>
                    {question.difficulty}
                  </span>
                  <a
                    href={question.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-dark"
                  >
                    View question <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border/70 bg-bg-secondary/40 px-5 py-5 text-center sm:px-6">
            <p className="text-sm text-text-secondary">
              Sign in or create an account to see all 15 companies and save solved questions.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
