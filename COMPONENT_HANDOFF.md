# Component Handoff Documentation

## Generic Reusable Components

This document tracks all generic, reusable components created for the system to ensure consistency and DRY principles.

---

### 1. Toggle Switch Component

**Location**: `src/app/shared/components/toggle-switch/`

**Purpose**: Generic toggle switch (iOS-style) for boolean on/off states

**Features**:
- Implements `ControlValueAccessor` for Angular forms integration
- Works with `[(ngModel)]` two-way binding
- Optional label text
- Disabled state support
- Consistent styling across the system
- Green background when active (`$success` color)
- Smooth transition animations

**API**:
- **Inputs**:
  - `label: string` - Optional label text displayed next to toggle
  - `disabled: boolean` - Disables the toggle
- **Outputs**:
  - `toggleChange: EventEmitter<boolean>` - Emits when toggle state changes

**Usage Example**:
```html
<!-- With ngModel -->
<app-toggle-switch
  [(ngModel)]="sendReminderOnCreate"
  name="sendReminder"
  label="שלח הודעת תזכורת לתשלום מיד ביצירה">
</app-toggle-switch>

<!-- With event handler -->
<app-toggle-switch
  [value]="isEnabled"
  label="Enable feature"
  (toggleChange)="onToggleChange($event)">
</app-toggle-switch>

<!-- Disabled state -->
<app-toggle-switch
  [(ngModel)]="setting"
  label="Disabled toggle"
  [disabled]="true">
</app-toggle-switch>
```

**Styling**:
- Toggle size: 44px × 24px
- Slider size: 20px × 20px
- Active color: `$success` (green #43a047)
- Inactive color: `$gray-300`
- Animation: 0.3s smooth transition
- Label font: 14px, `$text-dark`

**Used In**:
- Debt Form (`debt-form.html`) - "Send reminder on create" toggle

---

### 2. Dialog Header Component

**Location**: `src/app/shared/components/dialog-header/`

**Purpose**: Standardized dialog header for all modal dialogs

**Features**:
- Two variants: `primary` (blue background) and `default` (white background)
- Optional action icon
- Close button with hover effect
- Content projection for left-side content (e.g., info messages)
- Consistent padding (25px) and font size (20px)
- RTL layout support

**API**:
- **Inputs**:
  - `title: string` (required) - Dialog title text
  - `iconPath?: string` - Path to action icon
  - `variant: 'primary' | 'default'` (default: 'primary') - Background variant
  - `showCloseButton: boolean` (default: true) - Show/hide close button
  - `closeIconPath: string` (default: '/assets/icons/close-icon.svg') - Path to close icon
- **Outputs**:
  - `close: EventEmitter<void>` - Emitted when close button is clicked
- **Content Projection**:
  - `[header-left]` - For additional left-side content

**Usage Example**:
```html
<!-- Simple header -->
<app-dialog-header 
  title="יצירת חוב חדש"
  (close)="onClose()">
</app-dialog-header>

<!-- With icon -->
<app-dialog-header 
  title="יצירת חוב חדש"
  iconPath="/assets/icons/document-create-icon.svg"
  (close)="onClose()">
</app-dialog-header>

<!-- With left content -->
<app-dialog-header 
  title="חוב - נדר שבת"
  iconPath="/assets/icons/document-icon.svg"
  (close)="onClose()">
  <div header-left>
    <div class="info-message">
      <img src="/assets/icons/info-icon.svg" alt="Info" />
      <span>נשלחה תזכורת...</span>
    </div>
  </div>
</app-dialog-header>

<!-- Default variant (white background) -->
<app-dialog-header 
  title="הוסף חבר חדש"
  variant="default"
  (close)="onClose()">
</app-dialog-header>
```

**Used In**:
- Debt Form (`debt-form`)
- Invoice Form (`invoice-form`)
- Vow Set Form (`vow-set-form`)
- Member Form (`member-form`)

---

### 3. Chip Component

**Location**: `src/app/shared/components/chip/`

**Purpose**: Status/type badges with consistent styling

**Features**:
- Pre-defined variants for common statuses
- Custom colors support
- Rounded pill shape
- Uses color variables from `variables.sass`

**API**:
- **Inputs**:
  - `variant: ChipVariant` - Pre-defined style variant
  - `label: string` - Text to display
  - `customClass: string` - Additional CSS classes
  - `backgroundColor: string` - Override background color
  - `textColor: string` - Override text color
  - `borderColor: string` - Override border color

**Variants**:
- `pending` / `active` - Grey background
- `paid` - Green background, white text
- `overdue` - Light red background, red text
- `cancelled` - Light red background, red text
- `approved` - Light green background, green text
- `not-approved` - Light red background, red text

**Usage Example**:
```html
<!-- Using variant -->
<app-chip variant="paid" label="שולם"></app-chip>
<app-chip variant="pending" label="ממתין"></app-chip>

<!-- Custom colors -->
<app-chip 
  variant="default"
  label="Custom"
  backgroundColor="#f5f5f5"
  textColor="#666">
</app-chip>
```

**Used In**:
- Debts table status column

---

## Best Practices

1. **Always check for existing components** before creating new ones
2. **Use color variables** from `variables.sass` instead of hardcoded colors
3. **Support both RTL and LTR** layouts where applicable
4. **Implement accessibility** features (keyboard navigation, ARIA labels)
5. **Document new components** in this file immediately after creation
6. **Use TypeScript interfaces** for props and events
7. **Follow Angular style guide** for naming and structure
8. **Make components standalone** for easier reuse

---

## Color Variables Reference

Key colors used in components:
- `$btn-primary: #0b1a51` - Primary blue
- `$success: #43a047` - Green (success, enabled states)
- `$error: #e53935` - Red (errors, danger)
- `$error-light: #F08080` - Light red
- `$text-dark: #4A5565` - Dark text
- `$text-primary: #0b1a51` - Primary text color
- `$gray-300: #e0e0e0` - Light grey (borders, inactive)
- `$gray-700: #666` - Dark grey
- `$bg-light-yellow: #ffeed0` - Info message background

---

**Last Updated**: 2025-12-10
**Maintained By**: Development Team

