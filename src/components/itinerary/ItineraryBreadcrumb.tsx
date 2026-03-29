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
    <Breadcrumb className="mb-4 hidden md:block">
        <BreadcrumbList className="text-muted-foreground">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/my-itineraries" className="hover:text-primary transition-colors">
              My Itineraries
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-muted-foreground/60" />

        {collectionId && collectionName && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to={`/my-itineraries?collection=${collectionId}`}
                  className="hover:text-primary transition-colors"
                >
                  {collectionName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/60" />
          </>
        )}

        <BreadcrumbItem>
          <BreadcrumbPage className="text-foreground font-medium">
            {itineraryName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
