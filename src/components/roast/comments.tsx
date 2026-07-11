"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Heart, Loader2, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { cn, formatDate } from "@/lib/utils";
import type { CommentSort, RoastComment } from "@/lib/community/queries";

interface CommentsProps {
  auditId: string;
  comments: RoastComment[];
  currentUserId: string | null;
  isAdmin: boolean;
}

export function Comments({ auditId, comments, currentUserId, isAdmin }: CommentsProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [sort, setSort] = useState<CommentSort>("most_liked");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const sorted = useMemo(() => {
    const pinned = comments.filter((c) => c.pinned);
    const rest = comments.filter((c) => !c.pinned);
    rest.sort((a, b) => {
      if (sort === "most_liked") return b.like_count - a.like_count;
      const at = new Date(a.created_at).getTime();
      const bt = new Date(b.created_at).getTime();
      return sort === "oldest" ? at - bt : bt - at;
    });
    return [...pinned, ...rest];
  }, [comments, sort]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/roasts/${auditId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    } finally {
      setPosting(false);
    }
  }

  const sortTabs: { key: CommentSort; label: string }[] = [
    { key: "most_liked", label: t.roast.sortMostLiked },
    { key: "newest", label: t.roast.sortNewest },
    { key: "oldest", label: t.roast.sortOldest },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {format(t.roast.commentsCount, { n: comments.length })}
        </h3>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSort(tab.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sort === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {currentUserId ? (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t.roast.commentPlaceholder}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={posting || !body.trim()}>
              {posting ? <Loader2 className="animate-spin" /> : null}
              {posting ? t.roast.posting : t.roast.postComment}
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          {t.roast.signInToComment}
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t.roast.emptyComments}</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              locale={locale}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  locale,
  currentUserId,
  isAdmin,
}: {
  comment: RoastComment;
  locale: string;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [liked, setLiked] = useState(comment.liked_by_me);
  const [likes, setLikes] = useState(comment.like_count);
  const [busy, setBusy] = useState(false);
  const canDelete = isAdmin || comment.user_id === currentUserId;

  async function toggleLike() {
    if (!currentUserId || busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      await fetch(`/api/comments/${comment.id}/like`, { method: next ? "POST" : "DELETE" });
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  async function moderate(patch: { pinned?: boolean; hidden?: boolean }) {
    await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(t.roast.deleteComment + "?")) return;
    await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <li
      className={cn(
        "rounded-lg border bg-card p-4",
        comment.pinned && "border-primary/40 bg-primary/[0.03]",
        comment.hidden && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white">
            {comment.author_name[0]?.toUpperCase()}
          </span>
          <span className="text-sm font-medium">{comment.author_name}</span>
          {comment.pinned && (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <Pin className="size-3" /> {t.roast.pinned}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(comment.created_at, locale)}</span>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
        {comment.hidden && !isAdmin ? (
          <span className="italic text-muted-foreground">{t.roast.hiddenNotice}</span>
        ) : (
          comment.body
        )}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={!currentUserId || busy}
          aria-label={t.roast.likeAria}
          aria-pressed={liked}
          className={cn(
            "inline-flex items-center gap-1 text-xs transition-colors disabled:cursor-not-allowed",
            liked ? "text-rose-500" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("size-3.5", liked && "fill-rose-500")} />
          {likes}
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => moderate({ pinned: !comment.pinned })}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {comment.pinned ? t.roast.unpin : t.roast.pin}
            </button>
            <button
              type="button"
              onClick={() => moderate({ hidden: !comment.hidden })}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <EyeOff className="size-3" />
              {comment.hidden ? t.roast.unhide : t.roast.hide}
            </button>
          </>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-3" />
            {t.roast.deleteComment}
          </button>
        )}
      </div>
    </li>
  );
}
