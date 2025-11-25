import { LoadingContent } from "@/components/ui/Loading/LoadingContent";

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <LoadingContent className="justify-center" />
    </div>
  );
}
