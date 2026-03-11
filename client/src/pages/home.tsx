import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Prospect } from "@shared/schema";
import { STATUSES } from "@shared/schema";
import { ProspectCard } from "@/components/prospect-card";
import { AddProspectForm } from "@/components/add-prospect-form";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const columnColors: Record<string, string> = {
  Bookmarked: "bg-blue-500",
  Applied: "bg-indigo-500",
  "Phone Screen": "bg-violet-500",
  Interviewing: "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-gray-500",
};

type InterestFilter = "All" | "High" | "Medium" | "Low";

const interestFilterOptions: InterestFilter[] = ["All", "High", "Medium", "Low"];

const interestFilterColors: Record<InterestFilter, string> = {
  All: "",
  High: "text-red-500",
  Medium: "text-amber-500",
  Low: "text-muted-foreground",
};

type PendingMove = {
  prospectId: number;
  prospectName: string;
  fromStatus: string;
  toStatus: string;
} | null;

function KanbanColumn({
  status,
  prospects,
  isLoading,
  onDrop,
}: {
  status: string;
  prospects: Prospect[];
  isLoading: boolean;
  onDrop: (prospectId: number, fromStatus: string) => void;
}) {
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("All");
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const filteredProspects =
    interestFilter === "All"
      ? prospects
      : prospects.filter((p) => p.interestLevel === interestFilter);

  const columnSlug = status.replace(/\s+/g, "-").toLowerCase();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const prospectId = parseInt(e.dataTransfer.getData("prospectId"), 10);
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (!isNaN(prospectId) && fromStatus !== status) {
      onDrop(prospectId, fromStatus);
    }
  };

  return (
    <div
      className={`flex flex-col min-w-[260px] max-w-[320px] w-full rounded-md transition-all duration-150 ${
        isDragOver
          ? "bg-primary/10 ring-2 ring-primary/30"
          : "bg-muted/40"
      }`}
      data-testid={`column-${columnSlug}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <div className={`w-2 h-2 rounded-full shrink-0 ${columnColors[status] || "bg-gray-400"}`} />
        <h3 className="text-sm font-semibold truncate">{status}</h3>
        <Badge
          variant="secondary"
          className="ml-auto text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center no-default-active-elevate"
          data-testid={`badge-count-${columnSlug}`}
        >
          {filteredProspects.length}
        </Badge>
      </div>

      <div className="flex items-center gap-1 px-2 pt-2 pb-1">
        {interestFilterOptions.map((option) => (
          <button
            key={option}
            onClick={() => setInterestFilter(option)}
            data-testid={`filter-${columnSlug}-${option.toLowerCase()}`}
            className={`flex-1 text-[10px] font-medium py-0.5 rounded transition-colors
              ${
                interestFilter === option
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
              ${interestFilter === option && option !== "All" ? interestFilterColors[option] : ""}
            `}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
            </>
          ) : filteredProspects.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-8 text-center rounded-md transition-colors ${
                isDragOver ? "border-2 border-dashed border-primary/40" : ""
              }`}
              data-testid={`empty-${columnSlug}`}
            >
              <p className="text-xs text-muted-foreground">
                {prospects.length === 0 ? "No prospects" : "No matching prospects"}
              </p>
            </div>
          ) : (
            filteredProspects.map((prospect) => (
              <div
                key={prospect.id}
                draggable
                onDragStart={(e) => {
                  setDraggingId(prospect.id);
                  e.dataTransfer.setData("prospectId", String(prospect.id));
                  e.dataTransfer.setData("fromStatus", status);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDraggingId(null)}
                className={`transition-opacity duration-150 ${
                  draggingId === prospect.id ? "opacity-40" : "opacity-100"
                }`}
                data-testid={`draggable-${prospect.id}`}
              >
                <ProspectCard prospect={prospect} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove>(null);
  const { toast } = useToast();

  const { data: prospects, isLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/prospects/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const handleDrop = (prospectId: number, fromStatus: string, toStatus: string) => {
    const prospect = prospects?.find((p) => p.id === prospectId);
    if (!prospect) return;
    setPendingMove({
      prospectId,
      prospectName: prospect.companyName,
      fromStatus,
      toStatus,
    });
  };

  const confirmMove = () => {
    if (!pendingMove) return;
    statusMutation.mutate({ id: pendingMove.prospectId, status: pendingMove.toStatus });
    setPendingMove(null);
  };

  const cancelMove = () => {
    setPendingMove(null);
  };

  const groupedByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = (prospects ?? []).filter((p) => p.status === status);
      return acc;
    },
    {} as Record<string, Prospect[]>,
  );

  const totalCount = prospects?.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm shrink-0 z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight leading-tight" data-testid="text-app-title">
                  JobTrackr
                </h1>
                <p className="text-xs text-muted-foreground" data-testid="text-prospect-count">
                  {totalCount} prospect{totalCount !== 1 ? "s" : ""} tracked
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-prospect">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Prospect
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Prospect</DialogTitle>
                </DialogHeader>
                <AddProspectForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              prospects={groupedByStatus[status] || []}
              isLoading={isLoading}
              onDrop={(prospectId, fromStatus) => handleDrop(prospectId, fromStatus, status)}
            />
          ))}
        </div>
      </main>

      <AlertDialog open={pendingMove !== null} onOpenChange={(open) => !open && cancelMove()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move Prospect</AlertDialogTitle>
            <AlertDialogDescription>
              Move <strong>{pendingMove?.prospectName}</strong> from{" "}
              <strong>{pendingMove?.fromStatus}</strong> to{" "}
              <strong>{pendingMove?.toStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelMove} data-testid="button-cancel-move">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMove}
              disabled={statusMutation.isPending}
              data-testid="button-confirm-move"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
