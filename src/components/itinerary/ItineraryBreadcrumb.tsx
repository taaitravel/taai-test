import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useItineraryBreadcrumb } from "@/hooks/useItineraryBreadcrumb";

interface ItineraryBreadcrumbProps {
  itineraryId: number;
  itineraryName: string;
}

export const ItineraryBreadcrumb = ({ itineraryId, itineraryName }: ItineraryBreadcrumbProps) => {
  const { collectionId, collectionName, loading } = useItineraryBreadcrumb(itineraryId);

  if (loading) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList className="text-white/60">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/my-itineraries" className="hover:text-[#ffce87] transition-colors">
              My Itineraries
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-white/40" />

        {collectionId && collectionName && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to={`/my-itineraries?collection=${collectionId}`}
                  className="hover:text-[#ffce87] transition-colors"
                >
                  {collectionName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/40" />
          </>
        )}

        <BreadcrumbItem>
          <BreadcrumbPage className="text-white font-medium">
            {itineraryName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
