"use client";

import { useState, useEffect, useCallback } from "react";
import { NSFAward, Publication } from "@/types/nsf";

interface GrantData {
  grant: NSFAward;
  publications: Publication[];
}

interface PaperMetadata {
  title: string | null;
  abstract: string | null;
  authors: string | null;
  journal: string | null;
  year: number | null;
  url: string | null;
}

interface PublicationWithAbstract extends Publication {
  fetchedAbstract?: string | null;
  isLoadingAbstract?: boolean;
}

function formatCurrency(amount: string): string {
  const num = parseInt(amount, 10);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}

function SummarySection({
  title,
  content,
  isLoading,
  onGenerate,
  hasContent,
}: {
  title: string;
  content: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  hasContent: boolean;
}) {
  if (!hasContent && !content && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <span className="text-xl">🤖</span> {title}
        </h3>
        <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <span>Claude Sonnet is analyzing...</span>
        </div>
      </div>
    );
  }

  if (content) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <span className="text-xl">🤖</span> {title}
        </h3>
        <div className="prose prose-blue dark:prose-invert max-w-none">
          {content.split("\n").map((paragraph, i) => (
            paragraph.trim() && (
              <p key={i} className="text-gray-700 dark:text-gray-300 mb-3 last:mb-0">
                {paragraph}
              </p>
            )
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 border-dashed">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="text-xl">🤖</span> {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click to generate an AI-powered summary of the research outcomes
          </p>
        </div>
        <button
          onClick={onGenerate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Summary
        </button>
      </div>
    </div>
  );
}

function PublicationCard({
  pub,
  index,
  onFetchAbstract,
}: {
  pub: PublicationWithAbstract;
  index: number;
  onFetchAbstract: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    // Fetch abstract when expanding if we have a DOI and haven't fetched yet
    if (newExpanded && pub.doi && pub.fetchedAbstract === undefined) {
      onFetchAbstract();
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={handleExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                {index + 1}
              </span>
              {pub.year && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {pub.year}
                </span>
              )}
              {pub.journal && (
                <span className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                  {pub.journal}
                </span>
              )}
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white leading-snug">
              {pub.title}
            </h5>
            {pub.authors && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                {pub.authors}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pub.doi && (
              <a
                href={pub.doi}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                title="View Paper"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
          <div className="pt-3 space-y-3">
            {/* Abstract Section */}
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Abstract</span>
              {pub.isLoadingAbstract ? (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span>Loading abstract...</span>
                </div>
              ) : pub.fetchedAbstract ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                  {pub.fetchedAbstract}
                </p>
              ) : pub.fetchedAbstract === null ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                  Abstract not available from CrossRef
                </p>
              ) : !pub.doi ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                  No DOI available to fetch abstract
                </p>
              ) : null}
            </div>

            {pub.authors && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Authors</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{pub.authors}</p>
              </div>
            )}
            {pub.journal && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Journal</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{pub.journal}</p>
              </div>
            )}
            {pub.doi && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">DOI</span>
                <p className="text-sm mt-0.5">
                  <a
                    href={pub.doi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {pub.doi}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [grantData, setGrantData] = useState<GrantData | null>(null);
  const [publications, setPublications] = useState<PublicationWithAbstract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcomesSummary, setOutcomesSummary] = useState<string | null>(null);
  const [isLoadingOutcomesSummary, setIsLoadingOutcomesSummary] = useState(false);

  const fetchAbstractForPublication = useCallback(async (index: number, doi: string) => {
    setPublications(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isLoadingAbstract: true };
      return updated;
    });

    try {
      const response = await fetch(`/api/paper?doi=${encodeURIComponent(doi)}`);
      const data: PaperMetadata = await response.json();

      setPublications(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          fetchedAbstract: data.abstract,
          isLoadingAbstract: false
        };
        return updated;
      });
    } catch {
      setPublications(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          fetchedAbstract: null,
          isLoadingAbstract: false
        };
        return updated;
      });
    }
  }, []);

  const fetchOutcomesSummary = useCallback(async (grant: NSFAward, pubs: PublicationWithAbstract[]) => {
    setIsLoadingOutcomesSummary(true);

    // First, fetch all abstracts that we don't have yet
    const pubsWithAbstracts = await Promise.all(
      pubs.map(async (pub) => {
        if (pub.fetchedAbstract !== undefined || !pub.doi) {
          return pub;
        }
        try {
          const response = await fetch(`/api/paper?doi=${encodeURIComponent(pub.doi)}`);
          const data: PaperMetadata = await response.json();
          return { ...pub, fetchedAbstract: data.abstract };
        } catch {
          return { ...pub, fetchedAbstract: null };
        }
      })
    );

    // Update state with fetched abstracts
    setPublications(pubsWithAbstracts);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "outcomes",
          title: grant.title,
          outcomes: grant.projectOutComesReport,
          publications: pubsWithAbstracts.map(p => ({
            title: p.title,
            authors: p.authors,
            journal: p.journal,
            year: p.year,
            abstract: p.fetchedAbstract,
          })),
        }),
      });
      const data = await response.json();
      setOutcomesSummary(data.summary || null);
    } catch (err) {
      console.error("Failed to get outcomes summary:", err);
    } finally {
      setIsLoadingOutcomesSummary(false);
    }
  }, []);

  const fetchRandomGrant = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setOutcomesSummary(null);
    setPublications([]);

    try {
      const response = await fetch("/api/grant");
      if (!response.ok) {
        throw new Error("Failed to fetch grant");
      }
      const data: GrantData = await response.json();
      setGrantData(data);
      setPublications(data.publications.map(p => ({ ...p })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRandomGrant();
  }, [fetchRandomGrant]);

  const handleGenerateOutcomesSummary = () => {
    if (grantData) {
      fetchOutcomesSummary(grantData.grant, publications);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Random NSF Grant Explorer
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Discover what science is being funded
              </p>
            </div>
            <button
              onClick={fetchRandomGrant}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Random Grant
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchRandomGrant}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && !grantData && <LoadingSpinner />}

        {grantData && (
          <div className="space-y-6">
            {/* Grant Info Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Title Section */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {grantData.grant.title}
                  </h2>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
                    grantData.grant.activeAwd === "true"
                      ? "bg-green-500/20 text-green-100 border border-green-400/30"
                      : "bg-gray-500/20 text-gray-200 border border-gray-400/30"
                  }`}>
                    {grantData.grant.activeAwd === "true" ? "Active" : "Completed"}
                  </span>
                </div>
              </div>

              {/* Key Details */}
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Award Amount</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(grantData.grant.estimatedTotalAmt)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Institution</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {grantData.grant.awardeeName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {grantData.grant.awardeeCity}, {grantData.grant.awardeeStateCode}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Principal Investigator</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {grantData.grant.pdPIName}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Grant ID</div>
                    <a
                      href={`https://www.nsf.gov/awardsearch/showAward?AWD_ID=${grantData.grant.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      #{grantData.grant.id}
                    </a>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {grantData.grant.startDate} - {grantData.grant.expDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Abstract */}
              <div className="px-6 py-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Abstract
                </h3>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {grantData.grant.abstractText}
                  </p>
                </div>
              </div>
            </div>

            {/* Outcomes Section */}
            {(grantData.grant.projectOutComesReport || publications.length > 0) && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">
                    Research Outcomes & Publications
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Outcomes Report */}
                  {grantData.grant.projectOutComesReport && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Project Outcomes Report
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {grantData.grant.projectOutComesReport}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Publications List */}
                  {publications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Publications ({publications.length})
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Click on a publication to view its abstract
                      </p>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {publications.map((pub, index) => (
                          <PublicationCard
                            key={index}
                            pub={pub}
                            index={index}
                            onFetchAbstract={() => pub.doi && fetchAbstractForPublication(index, pub.doi)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Summary of Outcomes */}
            {(grantData.grant.projectOutComesReport || publications.length > 0) && (
              <SummarySection
                title="AI Summary of Research Outcomes"
                content={outcomesSummary}
                isLoading={isLoadingOutcomesSummary}
                onGenerate={handleGenerateOutcomesSummary}
                hasContent={true}
              />
            )}

            {/* No outcomes message */}
            {!grantData.grant.projectOutComesReport && publications.length === 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <h3 className="text-amber-800 dark:text-amber-200 font-semibold mb-2">
                  No Outcomes Available Yet
                </h3>
                <p className="text-amber-700 dark:text-amber-300">
                  This grant {grantData.grant.activeAwd === "true" ? "is currently active" : "has completed"} but no outcomes report or publications have been recorded yet.
                  {grantData.grant.activeAwd === "true" && " Results are typically reported after the research is complete."}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Data from{" "}
            <a
              href="https://www.research.gov/common/webapi/awardapisearch-v1.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              NSF Award Search API
            </a>
            . Paper abstracts from{" "}
            <a
              href="https://www.crossref.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              CrossRef
            </a>
            . AI summaries powered by Claude Sonnet.
          </p>
        </div>
      </footer>
    </div>
  );
}
