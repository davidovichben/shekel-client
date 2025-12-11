import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-image-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-input.html',
  styleUrl: './image-input.sass',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageInputComponent),
      multi: true
    }
  ]
})
export class ImageInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'בחר קובץ';
  @Input() accept = '.png,.jpg,.jpeg,.gif,.svg,.pdf';
  @Output() fileSelected = new EventEmitter<File>();

  fileName = '';
  imagePreview: string | null = null;
  private file: File | null = null;

  private onChange: (value: File | null) => void = () => {};
  private onTouched: () => void = () => {};

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.fileName = this.file.name;

      // Create image preview if it's an image file
      if (this.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(this.file);
      } else {
        this.imagePreview = null;
      }

      this.onChange(this.file);
      this.onTouched();
      this.fileSelected.emit(this.file);
    }
  }

  clearFile(): void {
    this.file = null;
    this.fileName = '';
    this.imagePreview = null;
    this.onChange(null);
  }

  writeValue(value: File | string | null): void {
    if (value instanceof File) {
      this.file = value;
      this.fileName = value.name;
      if (value.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(value);
      }
    } else if (typeof value === 'string') {
      this.fileName = value;
      this.imagePreview = null;
    } else {
      this.file = null;
      this.fileName = '';
      this.imagePreview = null;
    }
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
