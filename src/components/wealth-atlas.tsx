"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Building2, CreditCard, Gem, Landmark, Layers3, List, Network, Orbit, TrendingUp, WalletCards, type LucideIcon } from "lucide-react";
import { OWNER_KIND_LABELS } from "@/lib/labels";
import type { LineItem, OwnershipRow } from "@/lib/networth";
import type { Owner } from "@/lib/types";
import styles from "./wealth-atlas.module.css";

type Node = {
  id: string;
  name: string;
  detail: string;
  value: number;
  href: string;
  color: string;
  icon: LucideIcon;
  initial?: string;
  kind: "owner" | "capital";
  related: Set<string>;
};
type Point = { x: number; y: number };

// Deliberately spaced around the core: labels occupy different parts of the orbit.
const OWNER_POINTS: Point[] = [
  { x: 350, y: 88 }, { x: 170, y: 208 }, { x: 144, y: 335 },
  { x: 218, y: 469 }, { x: 359, y: 594 },
];
const CAPITAL_POINTS: Point[] = [
  { x: 600, y: 58 }, { x: 839, y: 103 }, { x: 1024, y: 226 },
  { x: 1050, y: 365 }, { x: 990, y: 487 }, { x: 813, y: 606 },
  { x: 590, y: 634 },
];
const GROUP_STYLE: Record<string, { color: string; icon: LucideIcon }> = {
  "Public Equities": { color: "#24775d", icon: TrendingUp },
  "Real Estate": { color: "#aa8144", icon: Building2 },
  "Private & Alternatives": { color: "#647da5", icon: Layers3 },
  "Cash & Equivalents": { color: "#419b86", icon: WalletCards },
  "Fixed Income": { color: "#829bbb", icon: Landmark },
  "Physical & Collectibles": { color: "#947366", icon: Gem },
  "Liabilities": { color: "#b65850", icon: CreditCard },
};

function routeForGroup(group: string) {
  if (group === "Cash & Equivalents") return "/accounts";
  if (group === "Liabilities") return "/liabilities";
  if (group.startsWith("Public") || group === "Fixed Income" || group === "Digital Assets") return "/investments";
  return "/assets";
}

export function WealthAtlas({
  householdName, owners, items, ownership = [], netWorthMinor, formatValue,
}: {
  householdName: string;
  owners: Owner[];
  items: LineItem[];
  ownership?: OwnershipRow[];
  netWorthMinor: number;
  formatValue: (minor: number) => string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [directory, setDirectory] = useState(false);
  const [compactKind, setCompactKind] = useState<"owner" | "capital">("owner");
  const directoryId = useId();
  const ownerValues = new Map<string, number>();
  const groupValues = new Map<string, number>();
  const ownerGroups = new Map<string, Set<string>>();
  const groupOwners = new Map<string, Set<string>>();
  const splitOwnership = new Map<string, OwnershipRow[]>();

  for (const row of ownership) {
    const key = `${row.holdable_type}:${row.holdable_id}`;
    splitOwnership.set(key, [...(splitOwnership.get(key) ?? []), row]);
  }
  for (const item of items) {
    groupValues.set(item.group, (groupValues.get(item.group) ?? 0) + item.baseMinor);
    const shares = splitOwnership.get(`${item.kind}:${item.id}`) ?? [{ owner_id: item.ownerId, percent: 100 }];
    for (const share of shares) {
      if (share.percent <= 0) continue;
      ownerValues.set(share.owner_id, (ownerValues.get(share.owner_id) ?? 0) + Math.round(item.baseMinor * share.percent / 100));
      ownerGroups.set(share.owner_id, (ownerGroups.get(share.owner_id) ?? new Set()).add(`capital:${item.group}`));
      groupOwners.set(item.group, (groupOwners.get(item.group) ?? new Set()).add(`owner:${share.owner_id}`));
    }
  }

  const ownerNodes: Node[] = owners
    .filter((owner) => ownerGroups.has(owner.id))
    .map((owner) => ({
      id: `owner:${owner.id}`, name: owner.name, detail: OWNER_KIND_LABELS[owner.kind],
      value: ownerValues.get(owner.id) ?? 0,
      href: `/family?focus=${encodeURIComponent(owner.id)}`,
      kind: "owner" as const, color: "#a97b34", icon: Landmark,
      initial: owner.kind === "individual" ? (/^(You|Spouse) \((.+)\)/.exec(owner.name)?.[2] ?? owner.name).slice(0, 1) : undefined,
      related: ownerGroups.get(owner.id) ?? new Set<string>(),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const assetTotal = [...groupValues.values()].reduce((sum, value) => sum + Math.max(0, value), 0);
  const capitalNodes: Node[] = [...groupValues.entries()]
    .filter(([, value]) => value !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .map(([group, value]) => ({
      id: `capital:${group}`, name: group,
      detail: value < 0 ? "Liability" : `${assetTotal ? Math.round(value / assetTotal * 100) : 0}% of assets`,
      value, href: routeForGroup(group), kind: "capital", related: groupOwners.get(group) ?? new Set(),
      ...(GROUP_STYLE[group] ?? { color: "#738672", icon: Layers3 }),
    }));
  const allNodes = [...ownerNodes, ...capitalNodes];
  const activeNode = allNodes.find((node) => node.id === (hoveredId ?? focusedId));
  const mapNodes = [
    ...ownerNodes.slice(0, OWNER_POINTS.length).map((node, index) => ({ node, point: OWNER_POINTS[index] })),
    ...capitalNodes.slice(0, CAPITAL_POINTS.length).map((node, index) => ({ node, point: CAPITAL_POINTS[index] })),
  ];
  const overflowCount = allNodes.length - mapNodes.length;
  const linked = (node: Node) => activeNode?.id === node.id || Boolean(activeNode?.related.has(node.id));
  const nodeEvents = {
    onHover: setHoveredId,
    onFocus: setFocusedId,
  };

  return (
    <section className={styles.atlas} aria-labelledby="atlas-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}><Orbit size={15} aria-hidden /> THE BIG PICTURE</p>
          <h2 id="atlas-title">Living Wealth <em>Atlas</em></h2>
          <p className={styles.intro}>Your people. Your assets. One connected world.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => setDirectory(!directory)} aria-pressed={directory} aria-controls={directoryId} className={styles.viewButton}>
            {directory ? <Orbit size={16} aria-hidden /> : <List size={16} aria-hidden />}
            {directory ? "Show map" : "View all"}
          </button>
          <Link className={styles.exploreLink} href="/net-worth">Explore net worth <ArrowUpRight size={16} aria-hidden /></Link>
        </div>
      </header>

      <div className={styles.map} hidden={directory}>
        <div className={styles.mapCanvas}>
          <div className={`${styles.territory} ${styles.ownerTerritory}`}><span /> People &amp; entities</div>
          <div className={`${styles.territory} ${styles.capitalTerritory}`}><span /> Where it lives</div>
          <svg className={styles.connections} viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden>
            <ellipse cx="600" cy="338" rx="413" ry="277" fill="none" stroke="#dce6e0" strokeWidth="1" />
            <ellipse cx="600" cy="338" rx="326" ry="211" fill="none" stroke="#dde6df" strokeWidth="1" strokeDasharray="2 8" />
            {mapNodes.map(({ node, point }) => {
              const dx = point.x - 600;
              const dy = point.y - 338;
              const bend = node.kind === "owner" ? -35 : 35;
              return <path key={node.id}
                d={`M 600 338 Q ${600 + dx * 0.6 + bend} ${338 + dy * 0.15} ${point.x} ${point.y}`}
                fill="none" stroke={linked(node) ? node.color : node.kind === "owner" ? "#c8b48f" : "#a4c9b8"}
                strokeWidth={linked(node) ? 2.5 : 1.2} strokeOpacity={linked(node) ? 0.95 : 0.7}
                strokeDasharray={node.kind === "owner" ? "4 6" : undefined}
                className={styles.connection}
              />;
            })}
            <circle cx="600" cy="61" r="4" fill="#287b5e" />
            <circle cx="274" cy="338" r="3" fill="#c09a5a" />
            <circle cx="600" cy="615" r="4" fill="#8baf9a" />
          </svg>
          <div className={styles.corePosition}>
            <HouseholdCore name={householdName} value={formatValue(netWorthMinor)} groups={capitalNodes} activeId={activeNode?.id} />
          </div>
          {mapNodes.map(({ node, point }) => (
            <div className={styles.nodePosition} style={{ left: `${point.x / 12}%`, top: `${point.y / 7}%` }} key={node.id}>
              <AtlasNode node={node} value={formatValue(node.value)} active={activeNode?.id === node.id} related={linked(node)} {...nodeEvents} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.compact} hidden={directory}>
        <HouseholdCore name={householdName} value={formatValue(netWorthMinor)} groups={capitalNodes} />
        <div className={styles.compactTabs} aria-label="Atlas connections">
          <button type="button" aria-pressed={compactKind === "owner"} onClick={() => setCompactKind("owner")}>People &amp; entities <span>{ownerNodes.length}</span></button>
          <button type="button" aria-pressed={compactKind === "capital"} onClick={() => setCompactKind("capital")}>Capital <span>{capitalNodes.length}</span></button>
        </div>
        <div className={styles.compactNodes}>
          {(compactKind === "owner" ? ownerNodes : capitalNodes).map((node) => <AtlasNode key={node.id} node={node} value={formatValue(node.value)} {...nodeEvents} />)}
        </div>
      </div>

      <div id={directoryId} className={styles.directory} hidden={!directory}>
        {[{ title: "People & entities", nodes: ownerNodes }, { title: "Capital", nodes: capitalNodes }].map((section) => (
          <section key={section.title}>
            <h3>{section.title} <span>{section.nodes.length}</span></h3>
            <div className={styles.directoryNodes}>{section.nodes.map((node) => <AtlasNode key={node.id} node={node} value={formatValue(node.value)} {...nodeEvents} />)}</div>
          </section>
        ))}
      </div>

      <footer className={styles.footer}>
        <p><Network size={15} aria-hidden />{activeNode ? <><strong>{activeNode.name}</strong><span className={styles.footerDetail}> · {activeNode.related.size} connected {activeNode.kind === "owner" ? (activeNode.related.size === 1 ? "capital class" : "capital classes") : (activeNode.related.size === 1 ? "owner" : "owners")}</span></> : "Follow a connection. Open any node to explore."}</p>
        {overflowCount > 0 && !directory ? <button type="button" onClick={() => setDirectory(true)}>View {overflowCount} more <ArrowRight size={14} aria-hidden /></button> : <span className={styles.connectionCount}>{ownerNodes.length} owners <i /> {capitalNodes.length} capital classes</span>}
      </footer>
    </section>
  );
}

function HouseholdCore({ name, value, groups, activeId }: { name: string; value: string; groups: Node[]; activeId?: string }) {
  const positive = groups.filter((node) => node.value > 0);
  const total = positive.reduce((sum, node) => sum + node.value, 0);
  let offset = 0;
  return (
    <Link href="/net-worth" aria-label={`Open ${name} net worth, ${value}`} className={styles.core}>
      <svg className={styles.allocationRing} viewBox="0 0 320 320" aria-hidden>
        <circle cx="160" cy="160" r="154" fill="none" stroke="#e4ece6" strokeWidth="1" />
        <circle cx="160" cy="160" r="141" fill="none" stroke="#e3ebe5" strokeWidth="5" />
        {positive.map((node) => {
          const share = total ? node.value / total * 100 : 0;
          const start = offset;
          offset += share;
          return <circle key={node.id} cx="160" cy="160" r="141" fill="none" stroke={node.color} strokeWidth={activeId === node.id ? 8 : 5} pathLength="100" strokeDasharray={`${Math.max(0, share - 1.2)} ${100 - Math.max(0, share - 1.2)}`} strokeDashoffset={-start} transform="rotate(-90 160 160)" className={styles.connection} />;
        })}
      </svg>
      <span className={styles.coreFace}>
        <span className={styles.coreIcon}><Orbit size={23} aria-hidden /></span>
        <span className={styles.coreLabel}>YOUR HOUSEHOLD</span>
        <strong className={styles.householdName}>{name}</strong>
        <span className={`${styles.coreAmount} tabular-nums`}>{value}</span>
        <span className={styles.coreCta}>Total net worth <ArrowUpRight size={14} aria-hidden /></span>
      </span>
    </Link>
  );
}

function AtlasNode({ node, value, active = false, related = false, onHover, onFocus }: {
  node: Node; value: string; active?: boolean; related?: boolean;
  onHover: (id: string | null) => void; onFocus: (id: string | null) => void;
}) {
  const Icon = node.icon;
  return (
    <Link href={node.href} aria-label={`Open ${node.name}, ${value}`}
      className={styles.node} data-kind={node.kind} data-active={active} data-related={related}
      style={{ "--node-color": node.color } as CSSProperties}
      onPointerEnter={() => onHover(node.id)} onPointerLeave={() => onHover(null)}
      onFocus={() => onFocus(node.id)} onBlur={() => onFocus(null)}
    >
      <span className={styles.nodeTop}>
        <span className={styles.avatar}>{node.initial ?? <Icon size={18} aria-hidden />}</span>
        <span className={styles.nodeHeading}><span className={styles.nodeDetail}>{node.detail}</span><strong>{node.name}</strong></span>
      </span>
      <span className={styles.nodeBottom}><span className={`${styles.nodeValue} tabular-nums`}>{value}</span><span className={styles.nodeArrow}><ArrowUpRight size={15} aria-hidden /></span></span>
    </Link>
  );
}
