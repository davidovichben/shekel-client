import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogConfig } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MemberGeneralComponent } from './general';
import { Member } from '../../../../../core/entities/member.entity';

describe('MemberGeneralComponent', () => {
  let component: MemberGeneralComponent;
  let fixture: ComponentFixture<MemberGeneralComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockMember: Member = {
    id: '123',
    firstName: 'יוחנן',
    lastName: 'יוחננוף',
    fullName: 'יוחנן יוחננוף',
    email: 'test@example.com',
    mobile: '058-448-2254',
    phone: '',
    type: 'permanent',
    title: 'mr',
    gender: '',
    country: 'ישראל',
    city: 'בני ברק',
    address: 'זבולון',
    address2: '87',
    zipcode: '5',
    balance: '0',
    gregorianBirthDate: null,
    hebrewBirthDate: null,
    gregorianWeddingDate: null,
    hebrewWeddingDate: null,
    gregorianDeathDate: null,
    hebrewDeathDate: null,
    contactPerson: '',
    contactPersonType: '',
    tag: '',
    memberNumber: '',
    hasWebsiteAccount: false,
    shouldMail: false,
    lastMessageDate: null,
    groups: []
  };

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockDialog.open.and.returnValue({
      afterClosed: () => of(false)
    } as any);

    await TestBed.configureTestingModule({
      imports: [MemberGeneralComponent, FormsModule, MatDialogModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberGeneralComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form data when member is provided', () => {
    component.member = mockMember;
    component.ngOnInit();

    expect(component.formData.firstName).toBe('יוחנן');
    expect(component.formData.lastName).toBe('יוחננוף');
    expect(component.formData.email).toBe('test@example.com');
    expect(component.formData.mobile).toBe('058-448-2254');
    expect(component.formData.type).toBe('permanent');
    expect(component.formData.title).toBe('mr');
    expect(component.formData.country).toBe('ישראל');
    expect(component.formData.city).toBe('בני ברק');
    expect(component.formData.address).toBe('זבולון');
    expect(component.formData.address2).toBe('87');
    expect(component.formData.zipcode).toBe('5');
  });

  it('should not populate form data when member is null', () => {
    component.member = null;
    component.ngOnInit();

    expect(component.formData.firstName).toBe('');
    expect(component.formData.lastName).toBe('');
  });

  it('should emit save event with form data when onSave is called', () => {
    spyOn(component.save, 'emit');
    component.member = mockMember;
    component.ngOnInit();

    component.onSave();

    expect(component.save.emit).toHaveBeenCalledWith(component.formData);
  });

  it('should open confirmation dialog when onCancel is called', () => {
    component.onCancel();

    expect(mockDialog.open).toHaveBeenCalled();
    const dialogConfig = mockDialog.open.calls.mostRecent().args[1] as MatDialogConfig;
    expect((dialogConfig?.data as any).title).toBe('ביטול שינויים');
  });

  it('should emit closeDialog when confirmation is accepted', () => {
    mockDialog.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);
    spyOn(component.closeDialog, 'emit');

    component.onCancel();

    expect(component.closeDialog.emit).toHaveBeenCalled();
  });

  it('should not emit closeDialog when confirmation is rejected', () => {
    mockDialog.open.and.returnValue({
      afterClosed: () => of(false)
    } as any);
    spyOn(component.closeDialog, 'emit');

    component.onCancel();

    expect(component.closeDialog.emit).not.toHaveBeenCalled();
  });

  it('should have correct type options in snake_case', () => {
    const typeValues = component.typeOptions.map(t => t.value);

    expect(typeValues).toContain('permanent');
    expect(typeValues).toContain('family_member');
    expect(typeValues).toContain('guest');
    expect(typeValues).toContain('supplier');
    expect(typeValues).toContain('primary_admin');
    expect(typeValues).toContain('other');
  });

  it('should have correct title options', () => {
    const titleValues = component.titleOptions.map(t => t.value);

    expect(titleValues).toContain('mr');
    expect(titleValues).toContain('mrs');
    expect(titleValues).toContain('rabbi');
    expect(titleValues).toContain('dr');
  });
});
