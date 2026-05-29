import { ArtistProfile } from '@/types';

export const SEED_ARTISTS: ArtistProfile[] = [
  {
    id: 'artist-001',
    name: 'Margot Wren',
    bio: 'Former librarian turned storyteller. I write about ordinary people in extraordinary places, with a soft spot for rainy afternoons and unreliable narrators.',
    genres: ['Literary Fiction', 'Mystery'],
    avatarColor: '#2D4A3E',
    avatarUri: 'https://i.pravatar.cc/150?u=margot-wren-001',
    baseLikes: 142,
    books: [
      {
        title: 'The Cartographer\'s Daughter',
        genre: 'Literary Fiction',
        excerpt: 'She traced the coastline with her finger, knowing that every map her father drew contained at least one deliberate lie.',
      },
      {
        title: 'What the River Forgot',
        genre: 'Mystery',
        excerpt: 'The body surfaced on a Thursday, which Agnes thought was rude — she had bridge club on Thursdays.',
      },
    ],
  },
  {
    id: 'artist-002',
    name: 'Dayo Okafor',
    bio: 'Nigerian-British author exploring identity, memory, and belonging. My stories live at the intersection of the personal and the political.',
    genres: ['Literary Fiction', 'Memoir'],
    avatarColor: '#C4913A',
    avatarUri: 'https://i.pravatar.cc/150?u=dayo-okafor-002',
    baseLikes: 218,
    books: [
      {
        title: 'Between Two Silences',
        genre: 'Literary Fiction',
        excerpt: 'My grandmother spoke two languages at home and neither of them was English. I grew up fluent in the spaces she left behind.',
      },
      {
        title: 'Lagos, 1987',
        genre: 'Memoir',
        excerpt: 'The power cut at 6 p.m. every evening, and in that darkness my father told us stories about the world before.',
      },
    ],
  },
  {
    id: 'artist-003',
    name: 'Petra Volkov',
    bio: 'Astrophysicist by day, science fiction author by night. I try to write the universe the way it actually feels — enormous, indifferent, and quietly beautiful.',
    genres: ['Sci-Fi', 'Speculative Fiction'],
    avatarColor: '#4A6C8A',
    avatarUri: 'https://i.pravatar.cc/150?u=petra-volkov-003',
    baseLikes: 305,
    books: [
      {
        title: 'The Parallax Year',
        genre: 'Sci-Fi',
        excerpt: 'They sent a signal. We received it 47 years later. By then, the civilization that sent it had already ended — twice.',
      },
      {
        title: 'Cold Light',
        genre: 'Speculative Fiction',
        excerpt: 'On a generation ship, everyone inherits their parents\' job. Mira had inherited the role of remembering things that never happened.',
      },
    ],
  },
  {
    id: 'artist-004',
    name: 'Callum Nash',
    bio: 'I grew up on the Scottish coast reading too many fantasy novels. Now I write my own, usually involving fog, old grudges, and magic that costs something.',
    genres: ['Fantasy', 'Adventure'],
    avatarColor: '#7A5A8A',
    avatarUri: 'https://i.pravatar.cc/150?u=callum-nash-004',
    baseLikes: 189,
    books: [
      {
        title: 'The Tide Warden\'s Oath',
        genre: 'Fantasy',
        excerpt: 'The sea had memory. That was the first thing they taught you on the islands — the sea remembered everything you tried to take from it.',
      },
      {
        title: 'Ashfall',
        genre: 'Fantasy',
        excerpt: 'Magic in this kingdom was taxed. Not in coin. In years.',
      },
    ],
  },
  {
    id: 'artist-005',
    name: 'Simone Adler',
    bio: 'Romance novelist based in Vienna. I believe every love story is also a story about becoming someone. I write happily-ever-afters that you have to earn.',
    genres: ['Romance', 'Contemporary Fiction'],
    avatarColor: '#C4704A',
    avatarUri: 'https://i.pravatar.cc/150?u=simone-adler-005',
    baseLikes: 412,
    books: [
      {
        title: 'The Second Draft',
        genre: 'Romance',
        excerpt: 'They had met at a writing retreat, fallen apart over a rejection letter, and now shared an editor. It was either fate or a clerical error.',
      },
      {
        title: 'This Version of Us',
        genre: 'Contemporary Fiction',
        excerpt: 'She kept a notebook of all the things she almost said to him. By autumn, it was full.',
      },
    ],
  },
  {
    id: 'artist-006',
    name: 'Jerome Lau',
    bio: 'Thriller writer from Hong Kong, now living in Toronto. I write the kind of books that make you miss your subway stop. Fast, tight, morally complicated.',
    genres: ['Thriller', 'Crime'],
    avatarColor: '#2D4A3E',
    avatarUri: 'https://i.pravatar.cc/150?u=jerome-lau-006',
    baseLikes: 276,
    books: [
      {
        title: 'The Quiet Leak',
        genre: 'Thriller',
        excerpt: 'Someone inside the agency was selling names. The trick was figuring out who — without becoming a name yourself.',
      },
      {
        title: 'Forty-Eight Hours',
        genre: 'Crime',
        excerpt: 'She had two days to prove he didn\'t do it. She had four suspects, a burner phone, and a ex-partner who still owed her a favour.',
      },
    ],
  },
  {
    id: 'artist-007',
    name: 'Anya Moreau',
    bio: 'Children\'s author and former primary school teacher. I write stories for kids who feel like they don\'t quite fit — because those are my favourite people.',
    genres: ["Children's", 'Middle Grade'],
    avatarColor: '#7A9E8A',
    baseLikes: 334,
    books: [
      {
        title: 'The Girl Who Collected Clouds',
        genre: "Children's",
        excerpt: 'Elspeth kept her cloud collection in seventeen glass jars on her windowsill. The problem was that clouds don\'t like being kept.',
      },
      {
        title: 'Marcus and the Dragon Who Couldn\'t',
        genre: "Children's",
        excerpt: 'Every dragon in the valley could breathe fire. Except Marcus, who breathed something much more embarrassing: compliments.',
      },
    ],
  },
  {
    id: 'artist-008',
    name: 'Reina Sato',
    bio: 'Historical fiction writer with a focus on overlooked women in history. If the history books ignored her, I want to write her story.',
    genres: ['Historical Fiction', 'Biography'],
    avatarColor: '#C4913A',
    avatarUri: 'https://i.pravatar.cc/150?u=reina-sato-008',
    baseLikes: 197,
    books: [
      {
        title: 'The Ink-Keeper\'s Wife',
        genre: 'Historical Fiction',
        excerpt: 'Kyoto, 1600. Her husband printed the proclamations of powerful men. She printed the words they were afraid to say.',
      },
      {
        title: 'A Cartographer Unnamed',
        genre: 'Historical Fiction',
        excerpt: 'Her maps were used by three expeditions. Her name appeared on none of them.',
      },
    ],
  },
  {
    id: 'artist-009',
    name: 'Tariq Bashir',
    bio: 'Self-help author and coach from Karachi. I write practical books for people who are quietly trying to reinvent themselves, one small decision at a time.',
    genres: ['Self-Help', 'Non-Fiction'],
    avatarColor: '#4A6C8A',
    avatarUri: 'https://i.pravatar.cc/150?u=tariq-bashir-009',
    baseLikes: 261,
    books: [
      {
        title: 'The Slow Rebuild',
        genre: 'Self-Help',
        excerpt: 'Nobody reinvents themselves overnight. It happens in the small moments — the habits you pick up and the ones you finally let go.',
      },
      {
        title: 'What You Stop Doing',
        genre: 'Self-Help',
        excerpt: 'Progress is often subtraction. This book is about all the things worth putting down.',
      },
    ],
  },
  {
    id: 'artist-010',
    name: 'Lucia Ferrante',
    bio: 'Italian-American debut novelist, MFA candidate. Writing a multigenerational family saga set between Sicily and New York. Fuelled by espresso and spite.',
    genres: ['Literary Fiction', 'Family Saga'],
    avatarColor: '#7A5A8A',
    avatarUri: 'https://i.pravatar.cc/150?u=lucia-ferrante-010',
    baseLikes: 88,
    books: [
      {
        title: 'The Ferrante Women',
        genre: 'Literary Fiction',
        excerpt: 'Three generations of women, one house in Palermo, and a secret that travelled across an ocean and still hadn\'t arrived.',
      },
      {
        title: 'Sunday Sauce',
        genre: 'Family Saga',
        excerpt: 'In the Ferrante family, love was expressed through food, arguments, and showing up without calling first.',
      },
    ],
  },
];
