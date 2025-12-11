import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.sass',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    }
  ]
})
export class FileUploadComponent implements ControlValueAccessor {
  @Input() accept = 'application/pdf,image/jpeg,image/jpg,image/png';
  @Input() maxSize = 10 * 1024 * 1024; // 10MB in bytes
  @Input() placeholder = 'בחר קובץ...';
  @Output() fileSelected = new EventEmitter<File>();

  selectedFile: File | null = null;
  fileName = '';
  errorMessage = '';
  inputId = `file-input-${Math.random().toString(36).substr(2, 9)}`;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: File | null): void {
    this.selectedFile = value;
    this.fileName = value ? value.name : '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validate file size
    if (file.size > this.maxSize) {
      this.errorMessage = `הקובץ גדול מדי. גודל מקסימלי: ${this.maxSize / (1024 * 1024)}MB`;
      input.value = '';
      return;
    }

    // Validate file type
    const validTypes = this.accept.split(',').map(t => t.trim());
    const fileType = file.type;
    const isValidType = validTypes.some(type => {
      if (type.includes('*')) {
        return fileType.startsWith(type.split('/')[0]);
      }
      return fileType === type;
    });

    if (!isValidType) {
      this.errorMessage = 'סוג קובץ לא נתמך. אנא בחר קובץ PDF או תמונה';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.selectedFile = file;
    this.fileName = file.name;
    this.onChange(file);
    this.onTouched();
    this.fileSelected.emit(file);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.errorMessage = '';
    this.onChange(null);
    this.onTouched();
  }
}

