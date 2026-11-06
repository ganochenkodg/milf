'use strict';

const NAME_PREFIXES = [
  'Ach', 'Adz', 'Ak', 'Aak', 'Az', 'Balg', 'Bilg', 'Blid', 'Blig', 'Blok', 'Blot', 'Bolg', 'Bot', 'Bug', 'Burk',
  'Dokh', 'Drik', 'Driz', 'Duf', 'Flug', 'Ga', 'Gad', 'Gag', 'Gah', 'Gak', 'Gar', 'Gat', 'Gaz', 'Ghag', 'Ghak',
  'Git', 'Glag', 'Glak', 'Glat', 'Glig', 'Gliz', 'Glok', 'Gnat', 'Gog', 'Grak', 'Grat', 'Guk', 'Hig', 'Irk', 'Kak',
  'Khad', 'Krig', 'Lag', 'Lak', 'Lig', 'Likk', 'Loz', 'Luk', 'Mak', 'Maz', 'Miz', 'Mub', 'Nad', 'Nag', 'Naz',
  'Nig', 'Nikk', 'Nogg', 'Nok', 'Nukk', 'Rag', 'Rak', 'Rat', 'Rok', 'Shrig', 'Shuk', 'Skrag', 'Skug', 'Slai', 'Slig',
  'Slog', 'Sna', 'Snag', 'Snark', 'Snat', 'Snig', 'Snik', 'Snit', 'Sog', 'Spik', 'Stogg', 'Tog', 'Urf', 'Vark', 'Yad',
  'Yagg', 'Yak', 'Yark', 'Yarp', 'Yig', 'Yip', 'Zat', 'Zib', 'Zit', 'Ziz', 'Argh', 'Barsh', 'Bog', 'Burz', 'Dof',
  'Drok', 'Drub', 'Drug', 'Dub', 'Dug', 'Dul', 'Dursh', 'Dush', 'Duz', 'Faug', 'Fug', 'Ghakh', 'Ghar', 'Ghash', 'Ghol',
  'Ghor', 'Ghukk', 'Ghul', 'Glub', 'Glud', 'Glug', 'Gluz', 'Gom', 'Grad', 'Grash', 'Grob', 'Grogg', 'Grok', 'Grol', 'Gru',
  'Gruf', 'Gruk', 'Grul', 'Grum', 'Grumf', 'Grut', 'Gruz', 'Guhl', 'Gulv', 'Hai', 'Hrung', 'Hur', 'Hurg', 'Kai', 'Klob',
  'Krod', 'Kug', 'Kulk', 'Kur', 'Lorg', 'Lug', 'Lukh', 'Lum', 'Lurz', 'Lush', 'Luz', 'Makh', 'Maug', 'Molg', 'Mud',
  'Mug', 'Mul', 'Murk', 'Muzd', 'Nakh', 'Narg', 'Obb', 'Rolb', 'Rukh', 'Ruz', 'Sharg', 'Shruf', 'Shud', 'Shug', 'Shur',
  'Shuz', 'Slub', 'Slud', 'Slug', 'Snad', 'Snog', 'Thrag', 'Thulk', 'Thurk', 'Trug', 'Ulg', 'Ur', 'Urd', 'Urgh', 'Urkh',
  'Uz', 'Yug', 'Yur', 'Zud', 'Zug'
];

const NAME_SUFFIXES = [
  'bor', 'din', 'in', 'ir', 'li', 'lin', 'nir', 'or', 'ri', 'rin', 'rok', 'ror', 'rur', 'vi', 'vir',
  'vor', 'bis', 'da', 'dis', 'ga', 'hild', 'is', 'lif', 'lind', 'lis', 'na', 'nis', 'ris', 'rith', 'run',
  'vis', 'ad', 'dan', 'del', 'dil', 'dir', 'fal', 'ion', 'lad', 'las', 'nar', 'orn', 'ras', 'rior', 'rod',
  'rond', 'ros', 'thir', 'edel', 'el', 'eth', 'ian', 'iel', 'ien', 'loth', 'mir', 'rial', 'rian', 'riel', 'rien',
  'ril', 'roël', 'sil', 'wë', 'wen', 'bra', 'dra', 'dril', 'ene', 'hel', 'ia', 'il', 'iln', 'ira', 'istra',
  'ith', 'iza', 'ra', 'tra', 'vra', 'vril', 'ach', 'akk', 'ash', 'azt', 'bahor', 'bar', 'bas', 'brax', 'charn',
  'dak', 'hrax', 'lach', 'lazt', 'mat', 'nam', 'nazt', 'ralk', 'rhast', 'sark', 'slarv', 'tash', 'thak', 'thalur', 'thalk',
  'vach', 'vap', 'dek', 'ech', 'fesh', 'gek', 'hrek', 'lech', 'met', 'ner', 'ter', 'blik', 'gith', 'igm', 'inax',
  'irsch', 'kir', 'lisk', 'lith', 'nilv', 'nirr', 'tlizit', 'chon', 'goch', 'gor', 'goth', 'hoth', 'khor', 'kos', 'loch',
  'lok', 'moch', 'moth', 'noc', 'och', 'oth', 'rolk', 'roth', 'sot', 'soth', 'vrok', 'dun', 'gur', 'hun', 'luth',
  'muth', 'nur', 'rutt', 'sut', 'sutt', 'szut', 'tur', 'urt', 'utuk', 'uzt', 'krych', 'nyth', 'slyth', 'gaan', 'xaas',
  'boak', 'ruaak', 'yalm', 'haerx', 'iex', 'draum', 'gaur', 'glaur', 'rauk', 'saur', 'duum', 'nuur', 'ruun'
];

Game.namegen = () => ROT.RNG.getItem(NAME_PREFIXES) + ROT.RNG.getItem(NAME_SUFFIXES);
