import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ItineraryPDFDocument } from '@/components/itinerary/ItineraryPDFDocument';
import { ItineraryData } from '@/types/itinerary';
import { toast } from 'sonner';

export const usePDFExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportToPDF = async (itineraryData: ItineraryData) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Generate the PDF blob
      const blob = await pdf(<ItineraryPDFDocument data={itineraryData} />).toBlob();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Generate filename from itinerary name
      const fileName = itineraryData.itin_name
        ? `${itineraryData.itin_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-itinerary.pdf`
        : `itinerary-${itineraryData.id}.pdf`;
      
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return { exportToPDF, isGenerating };
};
