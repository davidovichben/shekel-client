export enum ContactPersonType {
  Child = 'child',
  Parent = 'parent',
  Sibling = 'sibling',
  Spouse = 'spouse',
  BrotherInLaw = 'brotherInLaw',
  Grandparent = 'grandparent',
  SonInLaw = 'sonInLaw',
  Guest = 'guest',
  PhoneOperator = 'phoneOperator',
  Other = 'other'
}

export enum MemberType {
  Permanent = 'permanent',
  FamilyMember = 'familyMember',
  Guest = 'guest',
  Supplier = 'supplier',
  Other = 'other',
  PrimaryAdmin = 'primaryAdmin',
  SecondaryAdmin = 'secondaryAdmin'
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  mobile: string;
  phone: string;
  email: string;
  gender: string;
  address: string;
  address2: string;
  city: string;
  country: string;
  zipcode: string;
  gregorianBirthDate: string | null;
  hebrewBirthDate: string | null;
  gregorianWeddingDate: string | null;
  hebrewWeddingDate: string | null;
  gregorianDeathDate: string | null;
  hebrewDeathDate: string | null;
  contactPerson: string;
  contactPersonType: string;
  tag: string;
  title: string;
  type: string;
  memberNumber: string;
  hasWebsiteAccount: boolean;
  shouldMail: boolean;
  balance: string;
  lastMessageDate: string | null;
  groups: string[];
}
