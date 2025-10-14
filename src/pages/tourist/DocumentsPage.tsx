import Navigation from "@/components/Navigation";
import TouristDocuments from "@/components/TouristDocuments";

const DocumentsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="tourist" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TouristDocuments />
      </div>
    </div>
  );
};

export default DocumentsPage;
