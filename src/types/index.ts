import { Database } from "@/integrations/supabase/types";

// Tipuri de bază din database
export type GuideAssignmentRow = Database['public']['Tables']['guide_assignments']['Row'];
export type DailyReportRow = Database['public']['Tables']['daily_reports']['Row'];

// Activity type din enum
export type ActivityType = Database['public']['Enums']['activity_type'];

// Interface pentru Assignment cu relațiile (folosind intersection type în loc de extends)
export type Assignment = GuideAssignmentRow & {
  trips?: any;
  guides?: any;
};

// Interface pentru DailyReport cu relațiile
export type DailyReport = DailyReportRow & {
  guides?: any;
};