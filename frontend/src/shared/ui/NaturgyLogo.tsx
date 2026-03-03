interface NaturgyLogoProps {
  height?: number;
}

export function NaturgyLogo({ height = 36 }: NaturgyLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 50"
      height={height}
      aria-label="Naturgy company logo"
      role="img"
    >
      {/* Symbol: two overlapping rounded leaf shapes inspired by Naturgy brand */}
      <g transform="translate(3, 4)">
        {/* Orange petal – lower-left */}
        <path
          d="M8 36 C2 28 2 14 10 8 C16 4 22 6 24 12 C18 16 14 24 16 34 C13 36 10 37 8 36Z"
          fill="#ED7004"
        />
        {/* Blue petal – upper-right */}
        <path
          d="M34 8 C40 16 40 30 32 36 C26 40 20 38 18 32 C24 28 28 20 26 10 C29 8 32 7 34 8Z"
          fill="#005795"
        />
      </g>
      {/* "naturgy" text */}
      <text
        x="54"
        y="33"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="#005795"
        letterSpacing="-0.5"
      >
        naturgy
      </text>
    </svg>
  );
}
