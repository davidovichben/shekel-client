export enum AliyahType {
  Rishona = 'rishona',
  Shniya = 'shniya',
  Shlishit = 'shlishit',
  Reviit = 'reviit',
  Chamishit = 'chamishit',
  Shishit = 'shishit',
  Shviit = 'shviit',
  Maftir = 'maftir',
  Hagbaha = 'hagbaha',
  Glila = 'glila',
  Petichta = 'petichta',
  Other = 'other'
}

export interface VowItem {
  memberId: string;
  fullName: string;
  aliyahType: AliyahType | string;
  amount: number;
  sendReminder: boolean;
}

export interface VowSet {
  id: string;
  gregorianDate: string;
  hebrewDate: string;
  description: string;
  vows: VowItem[];
  createdAt: string;
  updatedAt: string;
}
