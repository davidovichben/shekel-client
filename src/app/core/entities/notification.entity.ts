export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'member' | 'income';
  type_id: string;
  is_read: boolean;
  created_at: string;
}
