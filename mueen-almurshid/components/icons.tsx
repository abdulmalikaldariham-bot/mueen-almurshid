import type { SVGProps } from 'react';

/** أيقونات خطية مجردة بحجم موحّد. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CopyIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
  </Icon>
);

export const SwapIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 8h13" />
    <path d="m14 4 4 4-4 4" />
    <path d="M20 16H7" />
    <path d="m10 12-4 4 4 4" />
  </Icon>
);

/** سهم ينعطف من السؤال إلى ما يليه (سؤال متابعة). */
export const FollowUpIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M19 4v6a4 4 0 0 1-4 4H5" />
    <path d="m9 10-4 4 4 4" />
  </Icon>
);

export const RefreshIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 4v5h-5" />
  </Icon>
);

export const EraseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M5 7h14" />
    <path d="M10 7V5h4v2" />
    <path d="M7 7l1 12h8l1-12" />
  </Icon>
);

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const SparkIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2z" />
  </Icon>
);

export const InfoIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 7.8v.2" />
  </Icon>
);

/** شعار الأداة: مسار حوار بثلاث محطات تزداد عمقًا. */
export function BrandMark() {
  return (
    <svg className="brand-mark" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      <rect width="44" height="44" rx="12" fill="var(--mark-bg)" />
      <path d="M30 11v8a6 6 0 0 1-6 6h-4a6 6 0 0 0-6 6v2" fill="none" stroke="var(--thread-1)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="11" r="3.2" fill="var(--thread-1)" />
      <circle cx="22" cy="25" r="3.2" fill="var(--mark-bg)" stroke="var(--thread-1)" strokeWidth="1.5" />
      <circle cx="14" cy="33" r="3.2" fill="var(--accent-bright)" />
    </svg>
  );
}
