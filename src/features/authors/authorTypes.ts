import { Author } from '../../types';

export type AuthorInput = Pick<Author, 'name' | 'slug'> &
  Partial<Pick<Author, 'bio' | 'email' | 'avatar_url'>>;
