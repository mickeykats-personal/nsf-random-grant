export interface NSFAward {
  id: string;
  title: string;
  abstractText: string;
  estimatedTotalAmt: string;
  fundsObligatedAmt: string;
  awardeeName: string;
  awardeeCity: string;
  awardeeStateCode: string;
  pdPIName: string;
  piEmail?: string;
  startDate: string;
  expDate: string;
  date: string;
  transType: string;
  program?: string;
  dirAbbr?: string;
  divAbbr?: string;
  orgLongName?: string;
  orgLongName2?: string;
  projectOutComesReport?: string;
  publicationResearch?: string[];
  activeAwd: string;
}

export interface NSFApiResponse {
  response: {
    metadata: {
      totalCount: number;
      rpp: number;
      offset: number;
    };
    award: NSFAward[];
  };
}

export interface Publication {
  year: string;
  authors: string;
  title: string;
  doi?: string;
  journal?: string;
}

export interface GrantWithSummary {
  grant: NSFAward;
  summary?: string;
  outcomesSummary?: string;
  publications: Publication[];
}
