// Flat construction in the sculpture's proportions, independent of its perspective.
// Both slashes share the same dimensions and slope; the second is translated by 300.
export const MATCHED_VIEWBOX = '680 0 970 850';
export const MATCHED_PATHS = {
  first: 'M1040 10 H1210 L870 830 H700 Z',
  second: 'M1340 10 H1510 L1170 830 H1000 Z',
  // Four identical quarter-turns around (1505, 710): no skew or perspective.
  star: 'M1505 590 C1521 674 1541 694 1625 710 C1541 726 1521 746 1505 830 C1489 746 1469 726 1385 710 C1469 694 1489 674 1505 590 Z',
};
