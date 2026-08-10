import type { FinderAnswers, ProgramFitLevel, ProgramFitResult, ProgramId } from './types';
import { getProgramById } from './programs';
import { getProgramLocationNote, isDpaGuidanceState } from './location-notes';

function pushUnique(list: string[], item: string) {
  if (!list.includes(item)) list.push(item);
}

/**
 * Educational “fit” heuristics only — never claims qualification.
 */
export function scoreProgramFits(answers: FinderAnswers): ProgramFitResult[] {
  const results: ProgramFitResult[] = [];

  const ids: ProgramId[] = [
    'conventional',
    'fha',
    'va',
    'usda',
    'down-payment-assistance',
  ];

  for (const id of ids) {
    results.push(scoreOne(id, answers));
  }

  const order: Record<ProgramFitLevel, number> = {
    'often-discussed': 0,
    'sometimes-relevant': 1,
    'less-common': 2,
    'learn-more': 3,
  };

  return results.sort((a, b) => order[a.fit] - order[b.fit]);
}

function scoreOne(id: ProgramId, a: FinderAnswers): ProgramFitResult {
  const reasons: string[] = [];
  const caveats: string[] = [
    'This is educational framing only — not an eligibility decision.',
  ];
  let fit: ProgramFitLevel = 'learn-more';

  const firstTime = a.firstTimeBuyer === 'yes';
  const lowDown =
    a.downPaymentComfort === 'under-3' || a.downPaymentComfort === '3-to-5';
  const midDown = a.downPaymentComfort === '5-to-20';
  const highDown = a.downPaymentComfort === '20-plus';
  const military = a.militaryInterest === 'yes';
  const purchase = a.purpose === 'purchase' || a.purpose === 'unsure' || a.purpose === '';

  if (id === 'conventional') {
    if (highDown || midDown) {
      fit = 'often-discussed';
      pushUnique(reasons, 'Many buyers with more cash to close explore conventional pricing first.');
    } else if (lowDown) {
      fit = 'sometimes-relevant';
      pushUnique(
        reasons,
        'Some conventional products allow lower down payments (product-specific); still compare with FHA.'
      );
    } else {
      fit = 'often-discussed';
      pushUnique(reasons, 'Conventional loans are a common baseline for comparison.');
    }
    if (a.purpose === 'refinance') {
      fit = 'often-discussed';
      pushUnique(reasons, 'Refinances often stay conventional when the existing loan type allows.');
    }
    pushUnique(caveats, 'PMI may apply below 20% down on many conventional purchases.');
  }

  if (id === 'fha') {
    if (lowDown || firstTime) {
      fit = 'often-discussed';
      if (firstTime) pushUnique(reasons, 'First-time buyers frequently research FHA’s lower down-payment themes.');
      if (lowDown)
        pushUnique(reasons, 'Limited down-payment cash is a common reason people read about FHA.');
    } else if (midDown) {
      fit = 'sometimes-relevant';
      pushUnique(reasons, 'FHA can still appear when conventional PMI pricing is less favorable.');
    } else {
      fit = 'less-common';
      pushUnique(reasons, 'With larger down payments, many people compare conventional first.');
    }
    if (a.purpose === 'refinance') {
      fit = fit === 'often-discussed' ? 'sometimes-relevant' : fit;
      pushUnique(reasons, 'FHA streamlines and cash-out rules differ from purchase—confirm product type.');
    }
    pushUnique(caveats, 'FHA MIP rules differ from conventional PMI and can last longer.');
  }

  if (id === 'va') {
    if (military) {
      fit = 'often-discussed';
      pushUnique(
        reasons,
        'You indicated interest in military/VA eligibility—VA is commonly researched by eligible borrowers.'
      );
      if (lowDown || a.downPaymentComfort === 'unsure' || a.downPaymentComfort === '') {
        pushUnique(reasons, 'VA is often associated with $0-down purchase themes when entitlement allows.');
      }
    } else if (a.militaryInterest === 'unsure') {
      fit = 'learn-more';
      pushUnique(reasons, 'If you may have qualifying service, VA is worth learning about; if not, skip.');
    } else {
      fit = 'less-common';
      pushUnique(reasons, 'VA is limited to eligible service members, veterans, and some surviving spouses.');
    }
    pushUnique(caveats, 'VA eligibility and COE are separate from lender underwriting approval.');
  }

  if (id === 'usda') {
    if (purchase && (lowDown || firstTime)) {
      fit = 'sometimes-relevant';
      pushUnique(
        reasons,
        'If the property is in a USDA-eligible area and income fits, USDA is often researched for low down-payment purchases.'
      );
    } else {
      fit = 'learn-more';
      pushUnique(reasons, 'USDA depends heavily on property location and household income limits.');
    }
    if (a.purpose === 'refinance') {
      fit = 'less-common';
      pushUnique(reasons, 'USDA purchase themes are more commonly discussed than general refinances.');
    }
    pushUnique(caveats, 'Check the official USDA eligibility map—suburban does not always mean eligible.');
  }

  if (id === 'down-payment-assistance') {
    if (firstTime || lowDown) {
      fit = 'often-discussed';
      pushUnique(
        reasons,
        'First-time or cash-constrained buyers often explore state/local down-payment assistance layered on a first mortgage.'
      );
    } else if (midDown) {
      fit = 'sometimes-relevant';
      pushUnique(reasons, 'Some DPA programs still help with closing costs even with moderate cash.');
    } else {
      fit = 'learn-more';
      pushUnique(reasons, 'DPA is most relevant when cash-to-close is tight; still useful to understand.');
    }
    if (isDpaGuidanceState(a.stateSlug)) {
      const loc = getProgramLocationNote(a.stateSlug);
      fit = fit === 'learn-more' ? 'sometimes-relevant' : 'often-discussed';
      if (loc) {
        pushUnique(
          reasons,
          `${loc.stateName} selected: begin with the official statewide housing finance starting points on our ${loc.stateName} DPA research panel, then treat city/county programs as a separate track.`
        );
        pushUnique(
          reasons,
          `Many ${loc.stateName} research paths pair DPA with FHA or conventional—mortgage insurance still follows the first loan.`
        );
        pushUnique(
          caveats,
          `${loc.stateName} HFA and local programs change; we do not list every county or guarantee open funding.`
        );
      }
    } else if (a.stateSlug && a.stateSlug !== 'other') {
      pushUnique(
        reasons,
        'For states without a dedicated module yet, start with your state housing finance agency and a HUD-approved counselor.'
      );
    }
    pushUnique(
      caveats,
      'DPA is local and changes; this tool does not list every program, reserve funds, or decide eligibility.'
    );
  }

  // Ensure program exists
  if (!getProgramById(id)) {
    return { programId: id, fit: 'learn-more', reasons, caveats };
  }

  return { programId: id, fit, reasons, caveats };
}

export function fitLevelLabel(fit: ProgramFitLevel): string {
  switch (fit) {
    case 'often-discussed':
      return 'Often discussed for profiles like yours';
    case 'sometimes-relevant':
      return 'Sometimes relevant';
    case 'less-common':
      return 'Less commonly the first stop';
    default:
      return 'Worth learning about';
  }
}
