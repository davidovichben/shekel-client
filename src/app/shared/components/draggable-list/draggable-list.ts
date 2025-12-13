import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DraggableItem {
  id: string;
  label: string;
  required?: boolean; // If true, shows lock icon and cannot be removed
}

@Component({
  selector: 'app-draggable-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './draggable-list.html',
  styleUrl: './draggable-list.sass'
})
export class DraggableListComponent {
  @Input() items: DraggableItem[] = [];
  @Output() itemRemoved = new EventEmitter<string>();
  @Output() orderChanged = new EventEmitter<DraggableItem[]>();

  draggedItem: DraggableItem | null = null;
  draggedIndex: number | null = null;

  onDragStart(event: DragEvent, item: DraggableItem, index: number): void {
    this.draggedItem = item;
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    
    if (this.draggedIndex === null || this.draggedItem === null) return;
    if (this.draggedIndex === dropIndex) return;

    const newItems = [...this.items];
    const [removed] = newItems.splice(this.draggedIndex, 1);
    newItems.splice(dropIndex, 0, removed);

    this.items = newItems;
    this.orderChanged.emit(newItems);
    
    this.draggedItem = null;
    this.draggedIndex = null;
  }

  onDragEnd(): void {
    this.draggedItem = null;
    this.draggedIndex = null;
  }

  removeItem(item: DraggableItem): void {
    if (!item.required) {
      this.itemRemoved.emit(item.id);
    }
  }
}

