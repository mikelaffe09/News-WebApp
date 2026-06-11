import { Category } from '../../types';

export type CategoryInput = Pick<Category, 'name' | 'slug' | 'description' | 'color'> & {
  sort_order?: number;
};

export interface CategoryQueryOptions {
  limit?: number;
  orderBy?: 'name' | 'sort_order' | 'sort_order_then_name';
}
