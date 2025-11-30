import { SearchType } from './AdaptiveSearchForm';
import { CategoryCarousel } from './CategoryCarousel';
import { useAICategorization } from '@/hooks/useAICategorization';
import { Loader2 } from 'lucide-react';

interface SearchResultsTreeProps {
  results: any[];
  searchType: SearchType;
  searchParams: any;
}

export const SearchResultsTree = ({
  results,
  searchType,
  searchParams
}: SearchResultsTreeProps) => {
  const { categories, loading } = useAICategorization(results, searchType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-white">Organizing results with AI...</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60 text-lg">Unable to categorize results</p>
        <p className="text-white/40 text-sm mt-2">Try the Grid or Map view instead</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.map((category, index) => (
        <CategoryCarousel
          key={`${category.name}-${index}`}
          categoryName={category.name}
          categoryIcon={category.icon}
          items={category.results}
          searchType={searchType}
          searchParams={searchParams}
        />
      ))}
    </div>
  );
};
