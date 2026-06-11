import { Article, Category, HomepageModule } from '../../types';

export interface HomepageData {
  breaking: Article[];
  hero: Article | null;
  featured: Article[];
  latest: Article[];
  trending: Article[];
  categories: Category[];
  categoryArticles: Record<string, Article[]>;
}

export type HomepageArticleOption = Pick<Article, 'id' | 'title' | 'slug'>;
export type HomepageCategoryOption = Pick<Category, 'id' | 'name' | 'slug'>;

export type HomepageModuleWithSelections = Omit<HomepageModule, 'article' | 'category'> & {
  article?: HomepageArticleOption | null;
  category?: HomepageCategoryOption | null;
};

export interface HomepageCurationData {
  modules: HomepageModuleWithSelections[];
  articles: HomepageArticleOption[];
  categories: Category[];
}
