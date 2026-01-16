"use client";

import { useState, useEffect, useCallback } from "react";
import { NSFAward, Publication } from "@/types/nsf";

interface GrantData {
  grant: NSFAward;
  publications: Publication[];
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
}: {
  title: string;
  content: string | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <span className="text-xl">&#129302;</span> {title}
        </h3>
        <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <span>Claude Opus 4.5 is analyzing...</span>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
        <span className="text-xl">&#129302;</span> {title}
      </h3>
      <div className="prose prose-blue dark:prose-invert max-w-none">
        {content.split("\n").map((paragraph, i) => (
          <p key={i} className="text-gray-700 dark:text-gray-300 mb-3 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [grantData, setGrantData] = useState<GrantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantSummary, setGrantSummary] = useState<string | null>(null);
  const [outcomesSummary, setOutcomesSummary] = useState<string | null>(null);
  const [isLoadingGrantSummary, setIsLoadingGrantSummary] = useState(false);
  const [isLoadingOutcomesSummary, setIsLoadingOutcomesSummary] = useState(false);

  const fetchGrantSummary = useCallback(async (grant: NSFAward) => {
    setIsLoadingGrantSummary(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "grant",
          title: grant.title,
          abstract: grant.abstractText,
        }),
      });
      const data = await response.json();
      setGrantSummary(data.summary || null);
    } catch (err) {
      console.error("Failed to get grant summary:", err);
    } finally {
      setIsLoadingGrantSummary(false);
    }
  }, []);

  const fetchOutcomesSummary = useCallback(async (grant: NSFAward, publications: Publication[]) => {
    if (!grant.projectOutComesReport && publications.length === 0) {
      setOutcomesSummary(null);
      return;
    }

    setIsLoadingOutcomesSummary(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "outcomes",
          title: grant.title,
          outcomes: grant.projectOutComesReport,
          publications: publications,
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
    setGrantSummary(null);
    setOutcomesSummary(null);

    try {
      const response = await fetch("/api/grant");
      if (!response.ok) {
        throw new Error("Failed to fetch grant");
      }
      const data: GrantData = await response.json();
      setGrantData(data);

      // Fetch AI summaries in parallel
      fetchGrantSummary(data.grant);
      fetchOutcomesSummary(data.grant, data.publications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [fetchGrantSummary, fetchOutcomesSummary]);

  useEffect(() => {
    fetchRandomGrant();
  }, [fetchRandomGrant]);

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
          <div className="space-y-8">
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

            {/* AI Summary of Grant */}
            <SummarySection
              title="AI Explanation (Claude Opus 4.5)"
              content={grantSummary}
              isLoading={isLoadingGrantSummary}
            />

            {/* Outcomes Section */}
            {(grantData.grant.projectOutComesReport || grantData.publications.length > 0) && (
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
                  {grantData.publications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Publications ({grantData.publications.length})
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {grantData.publications.map((pub, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                          >
                            {pub.title && (
                              <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                                {pub.doi ? (
                                  <a
                                    href={pub.doi}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {pub.title}
                                  </a>
                                ) : (
                                  pub.title
                                )}
                              </h5>
                            )}
                            {pub.authors && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {pub.authors}
                              </p>
                            )}
                            <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-500">
                              {pub.journal && <span>{pub.journal}</span>}
                              {pub.year && <span>{pub.year}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Summary of Outcomes */}
            {(grantData.grant.projectOutComesReport || grantData.publications.length > 0) && (
              <SummarySection
                title="AI Summary of Research Outcomes"
                content={outcomesSummary}
                isLoading={isLoadingOutcomesSummary}
              />
            )}

            {/* No outcomes message */}
            {!grantData.grant.projectOutComesReport && grantData.publications.length === 0 && (
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
            . AI summaries powered by Claude Opus 4.5.
          </p>
        </div>
      </footer>
    </div>
  );
}
