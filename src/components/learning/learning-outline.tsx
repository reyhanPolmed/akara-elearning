import { Link } from "react-router-dom";

import type { LearningSidebarItem } from "../../lib/learning-api";
import { cn } from "../../lib/utils";
import { learningPanelClassName } from "../mahasiswa/learning-workspace";

type LearningOutlineProps = {
  items: LearningSidebarItem[];
  activeItem?: {
    id: string;
    type: LearningSidebarItem["type"];
  };
};

const typeLabel = {
  lesson: "Materi",
  quiz: "Kuis",
  task: "Tugas",
} satisfies Record<LearningSidebarItem["type"], string>;

export function getLearningItemHref(item: LearningSidebarItem) {
  if (item.type === "lesson") return `/mahasiswa/materi/${item.id}`;
  if (item.type === "quiz") return `/mahasiswa/kuis/${item.id}`;
  return `/mahasiswa/tugas/${item.id}`;
}

function isActiveItem(item: LearningSidebarItem, activeItem?: LearningOutlineProps["activeItem"]) {
  return Boolean(activeItem && activeItem.id === item.id && activeItem.type === item.type);
}

export function LearningOutline({ items, activeItem }: LearningOutlineProps) {
  const groups = items.reduce<Array<{ chapter: string; items: LearningSidebarItem[] }>>(
    (accumulator, item) => {
      const lastGroup = accumulator.at(-1);
      if (lastGroup?.chapter === item.chapter) {
        lastGroup.items.push(item);
        return accumulator;
      }

      accumulator.push({
        chapter: item.chapter,
        items: [item],
      });
      return accumulator;
    },
    []
  );

  return (
    <section className={learningPanelClassName}>
      <header className="border-b border-[#e5e5e5] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
          Outline mata kuliah
        </p>
        <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">
          Daftar pembelajaran
        </h2>
      </header>

      {groups.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[#737373]">Belum ada outline dari backend.</p>
      ) : (
        <div className="divide-y divide-[#e5e5e5]">
          {groups.map((group, groupIndex) => (
            <section key={`${group.chapter}-${groupIndex}`}>
              <div className="bg-[#fafafa] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                  Bab {groupIndex + 1}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-[#0a0a0a]">{group.chapter}</h3>
              </div>
              <div className="divide-y divide-[#eeeeee]">
                {group.items.map((item, itemIndex) => (
                  <OutlineItem
                    active={isActiveItem(item, activeItem)}
                    index={itemIndex}
                    item={item}
                    key={`${item.type}-${item.id}`}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function OutlineItem({
  item,
  index,
  active,
}: {
  item: LearningSidebarItem;
  index: number;
  active: boolean;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          item.isCompleted
            ? "bg-emerald-600"
            : active
              ? "bg-[var(--color-primary)]"
              : "bg-[#d4d4d4]"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold leading-6", item.isCompleted ? "text-[#737373]" : "text-[#0a0a0a]")}>
          {index + 1}. {item.title}
        </p>
        <p className="mt-0.5 text-xs text-[#737373]">{typeLabel[item.type]}</p>
      </div>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
        {item.isLocked ? "Terkunci" : item.isCompleted ? "Selesai" : active ? "Aktif" : "Buka"}
      </span>
    </>
  );
  const className = cn(
    "flex gap-3 border-l-2 px-5 py-4 transition-colors",
    active ? "border-[var(--color-primary)] bg-[#fafafa]" : "border-transparent hover:bg-[#fafafa]",
    item.isLocked && "cursor-not-allowed opacity-60"
  );

  if (item.isLocked) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link className={className} to={getLearningItemHref(item)}>
      {content}
    </Link>
  );
}
