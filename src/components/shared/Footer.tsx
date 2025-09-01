import React from "react";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <span>© 2024 TravelPro.</span>
            <span>Toate drepturile rezervate.</span>
          </div>
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Developed with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by <span className="font-medium text-foreground">Gigi</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;