import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectAuthUser } from "@/store/authSlice";
import {
  getLeaderboard,
  type LeaderboardEntry,
} from "@/lib/api/portfolioApi";
import { generateAvatarUrl } from "@/components/portfolio/shared/utils";

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const getRankBadgeVariant = (
  rank: number
): "default" | "secondary" | "outline" => {
  if (rank <= 3) return "outline";
  return "outline";
};

const getMedalBadgeClass = (rank: number): string => {
  if (rank === 1) return "border-yellow-400 bg-yellow-100 text-yellow-900";
  if (rank === 2) return "border-slate-400 bg-slate-100 text-slate-900";
  if (rank === 3) return "border-amber-700 bg-amber-100 text-amber-900";
  return "";
};

const getRankLabel = (rank: number): string => {
  if (rank === 1) return "🥇 #1";
  if (rank === 2) return "🥈 #2";
  if (rank === 3) return "🥉 #3";
  return `#${rank}`;
};

const LeaderboardPage: React.FC = () => {
  const currentUser = useSelector(selectAuthUser);

  const {
    data: leaderboard = [],
    isLoading,
    isError,
    error,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ["portfolio", "leaderboard"],
    queryFn: getLeaderboard,
  });

  const podiumOrder = [2, 1, 3]
    .map((rank) => leaderboard.find((item) => item.rank === rank) || null)
    .filter((item): item is LeaderboardEntry => item !== null);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              Không thể tải dữ liệu leaderboard. Vui lòng thử lại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              {(error as Error)?.message || "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>
        <Badge variant="outline" className="gap-1">
          <Trophy className="h-3.5 w-3.5" />
          {leaderboard.length} users
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {podiumOrder.length > 0 ? (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
              {podiumOrder.map((item) => {
                const isCurrentUser = currentUser?.userId === item.userId;
                const isTop1 = item.rank === 1;
                const avatarSrc =
                  item.avatarUrl ||
                  generateAvatarUrl(item.displayName || item.email);

                return (
                  <Card
                    key={`podium-${item.userId}`}
                    className={`overflow-hidden border ${
                      isTop1
                        ? "order-1 md:order-2 md:-translate-y-2 border-primary/40 bg-gradient-to-b from-primary/15 to-card"
                        : item.rank === 2
                        ? "order-2 md:order-1 border-border bg-gradient-to-b from-muted/40 to-card"
                        : "order-3 md:order-3 border-secondary/40 bg-gradient-to-b from-secondary/20 to-card"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <Badge
                          variant={getRankBadgeVariant(item.rank)}
                          className={getMedalBadgeClass(item.rank)}
                        >
                          {getRankLabel(item.rank)}
                        </Badge>
                        {isCurrentUser ? (
                          <span className="text-xs text-muted-foreground">you</span>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <img
                          src={avatarSrc}
                          alt={item.displayName}
                          className={`mb-3 rounded-full border object-cover ${
                            isTop1 ? "h-20 w-20" : "h-16 w-16"
                          }`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = generateAvatarUrl(
                              item.displayName || item.email
                            );
                          }}
                        />
                        <p className="line-clamp-1 text-base font-semibold">{item.displayName}</p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Score</p>
                          <p className="font-semibold">{formatNumber(item.score)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Commits</p>
                          <p className="font-semibold">{formatNumber(item.commits)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Commits</TableHead>
                <TableHead className="text-right">Week</TableHead>
                <TableHead className="text-right">High</TableHead>
                <TableHead className="text-right">Streak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((item) => {
                const isCurrentUser = currentUser?.userId === item.userId;
                const avatarSrc =
                  item.avatarUrl ||
                  generateAvatarUrl(item.displayName || item.email);

                return (
                  <TableRow
                    key={item.userId}
                    className={isCurrentUser ? "bg-muted/40" : undefined}
                  >
                    <TableCell>
                      <Badge
                        variant={getRankBadgeVariant(item.rank)}
                        className={getMedalBadgeClass(item.rank)}
                      >
                        {getRankLabel(item.rank)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarSrc}
                          alt={item.displayName}
                          className="h-8 w-8 rounded-full border object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = generateAvatarUrl(
                              item.displayName || item.email
                            );
                          }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {item.displayName}
                            {isCurrentUser ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (you)
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(item.score)}
                    </TableCell>
                    <TableCell className="text-right">{item.commits}</TableCell>
                    <TableCell className="text-right">
                      {item.commitsLast30Days}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.highPriorityCommits}
                    </TableCell>
                    <TableCell className="text-right">{item.streakDays}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
