// Baltimore fun facts, shown at random after each level (no repeats until the pool runs out).
export const FACTS = [
  'Francis Scott Key wrote the words to "The Star-Spangled Banner" in 1814 after watching the British bombard Fort McHenry.',
  'Fort McHenry is shaped like a five-pointed star.',
  'The nickname "Charm City" came from a 1975 campaign by local ad execs to boost the city\'s image.',
  'John Quincy Adams called Baltimore "the Monumental City" during an 1827 visit.',
  'Baltimore\'s Washington Monument, begun in 1815, was the first major monument to George Washington. Its architect, Robert Mills, later designed the one in D.C.',
  'Edgar Allan Poe died in Baltimore in 1849 and is buried at Westminster Hall and Burying Ground.',
  'For decades, a mystery visitor called the "Poe Toaster" left roses and cognac at Poe\'s grave on his birthday.',
  'Poe lived in a small Baltimore rowhouse in the 1830s. Today it is the Edgar Allan Poe House and Museum.',
  'Baltimore\'s NFL team is named after Poe\'s poem "The Raven." Fans picked the name in a poll.',
  'The Baltimore oriole is Maryland\'s state bird. Its orange and black match the Calvert family coat of arms of the Lords Baltimore.',
  'Babe Ruth was born in Baltimore in 1895.',
  'Oriole Park at Camden Yards opened in 1992 and kicked off a wave of retro-style ballparks across the country.',
  'The B&O Warehouse beside Camden Yards is often called the longest building on the East Coast, at about 1,000 feet.',
  'Cal Ripken Jr. broke Lou Gehrig\'s consecutive-games record at Camden Yards in 1995 with game number 2,131.',
  'The Baltimore and Ohio Railroad, chartered in 1827, was one of the first common-carrier railroads in America.',
  'In 1830 the B&O\'s little steam engine "Tom Thumb" raced a horse-drawn car. The horse won when the engine broke down.',
  'Old Bay Seasoning was created in Baltimore in 1939 by Gustav Brunn.',
  'The blue crab\'s scientific name, Callinectes sapidus, means "beautiful savory swimmer."',
  'You can tell a female blue crab by her red-tipped claws, sometimes called "painted nails."',
  'Berger Cookies have been baked in Baltimore since 1835, when German immigrant Henry Berger brought the recipe over.',
  'National Bohemian beer was first brewed in Baltimore in 1885.',
  'The one-eyed, mustached "Mr. Boh" mascot first appeared in 1936.',
  'The Natty Boh Tower in Brewers Hill still lights up the skyline with Mr. Boh\'s face.',
  'Utz potato chips come from Hanover, Pennsylvania, where the company started in 1921. They\'ve been a Baltimore favorite for generations.',
  'Arabbers sell fresh produce from horse-drawn carts, a Baltimore street tradition dating back to the 1800s.',
  'Formstone, the fake stone that covers many rowhouses, was patented in Baltimore in 1937. John Waters called it "the polyester of brick."',
  'Marble front steps are a Baltimore trademark, and residents traditionally kept them scrubbed bright white.',
  'Fells Point was laid out as a town in 1763 and still has cobblestone streets.',
  'Frederick Douglass worked in the Fells Point shipyards as a young man and escaped slavery from Baltimore in 1838.',
  'The USS Constellation, docked in the Inner Harbor, was launched in 1854. She was the last all-sail warship built by the U.S. Navy.',
  'The National Aquarium opened in the Inner Harbor in 1981.',
  'The Bromo-Seltzer Tower\'s clock faces use the letters B-R-O-M-O-S-E-L-T-Z-E-R instead of numbers.',
  'The Great Baltimore Fire of 1904 burned more than 1,500 buildings across about 140 acres downtown.',
  'Lexington Market, founded in 1782, is one of the oldest continuously operating public markets in the country.',
  'Johns Hopkins Hospital opened in Baltimore in 1889.',
  'Thurgood Marshall, the first African American Supreme Court justice, was born and raised in Baltimore.',
  'Billie Holiday grew up in Baltimore, and a statue of her stands on Pennsylvania Avenue.',
  'The Baltimore Colts left for Indianapolis overnight in March 1984, packed into moving vans.',
  'Hampden\'s HonFest celebrates the classic Baltimore "Hon," with beehive hairdos and cat-eye glasses.',
  'The Ouija board was patented in 1891 by a group of Baltimore businessmen.',
  'Duckpin bowling is said to have been invented in Baltimore around 1900.',
  'The American Visionary Art Museum in Federal Hill opened in 1995 and showcases self-taught artists.',
  'Druid Hill Park, established in 1860, is one of the oldest large landscaped parks in the United States.',
];

let bag = [];
export function nextFact() {
  if (!bag.length) {
    bag = FACTS.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return bag.pop();
}
