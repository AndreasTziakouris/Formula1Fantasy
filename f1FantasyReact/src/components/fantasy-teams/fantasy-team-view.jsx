import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { EMPTY_IMAGE, resolveAssetUrl } from "../../lib/assets";

const BUDGET_CAP = 100;
const TOTAL_ROUNDS = 24;

const FantasyTeamView = () => {
  const { teamId } = useParams();
  const [apiError, setApiError] = useState("");
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadFantasyTeam = async () => {
      try {
        setLoading(true);
        setApiError("");

        const data = await apiRequest(
          `/fantasyTeams/get-fantasy-team/${teamId}`,
          {
            auth: true,
          }
        );

        if (!ignore) {
          setFantasyTeam(data.team?.[0] || null);
        }
      } catch (err) {
        if (!ignore) {
          setApiError(err.message || "Failed to fetch fantasy team");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadFantasyTeam();

    return () => {
      ignore = true;
    };
  }, [teamId]);

  const normalizedHistory = useMemo(() => {
    const raceHistory = fantasyTeam?.raceHistory ?? [];
    const byRound = Object.fromEntries(
      raceHistory.map((record) => [record.roundNumber, record])
    );

    return Array.from({ length: TOTAL_ROUNDS }, (_, index) => {
      const roundNumber = index + 1;
      const record = byRound[roundNumber] || null;
      const createdAt = fantasyTeam?.createdAtGP ?? 1;

      if (record) {
        return {
          roundNumber,
          status: "played",
          record,
        };
      }

      return {
        roundNumber,
        status: roundNumber < createdAt ? "not_created" : "no_entry",
        record: null,
      };
    });
  }, [fantasyTeam]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h3 className="text-lg font-semibold text-slate-700">Loading team...</h3>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-red-600">{apiError}</p>
      </div>
    );
  }

  if (!fantasyTeam) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-slate-600">Fantasy team not found.</p>
      </div>
    );
  }

  const remainingBudget = Number(fantasyTeam.remainingBudget ?? 0);
  const usedBudget = BUDGET_CAP - remainingBudget;
  const usedPct = Math.min(100, Math.max(0, (usedBudget / BUDGET_CAP) * 100));
  const driverSlots = [...fantasyTeam.f1Drivers, ...Array(5).fill(null)].slice(
    0,
    5
  );
  const teamSlots = [...fantasyTeam.f1Teams, ...Array(2).fill(null)].slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            to="/fantasyTeams"
            className="inline-flex rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Back to teams
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {fantasyTeam.fantasyTeamName}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Created in round {fantasyTeam.createdAtGP}. Track cost-cap usage and
            round-by-round scoring history here.
          </p>
        </div>

        <Link
          to={`/fantasyTeams/edit/${teamId}`}
          state={{ team: fantasyTeam }}
          className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Edit Team
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span>Cost Cap</span>
          <span>
            ${usedBudget.toFixed(1)} M / {BUDGET_CAP} M
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Remaining Budget
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              ${remainingBudget.toFixed(1)} M
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Transfers Left
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {fantasyTeam.remainingTransfers}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total Points
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {fantasyTeam.totalPoints}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Drivers</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {driverSlots.map((slot, index) => {
            if (!slot?.driverId) {
              return (
                <div
                  key={`empty-driver-${index}`}
                  className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400"
                >
                  <img
                    src={EMPTY_IMAGE}
                    alt="Empty driver slot"
                    className="h-20 w-20 rounded-full object-cover opacity-60"
                  />
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide">
                    Empty Driver Slot
                  </p>
                </div>
              );
            }

            const driver = slot.driverId;
            const driverLabel = `${driver.name?.charAt(0) || ""}. ${driver.surname?.toUpperCase()}`;

            return (
              <article
                key={driver._id}
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {slot.doublePoints ? (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-black/80 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    DRS x2
                  </span>
                ) : null}
                <img
                  src={resolveAssetUrl(driver.imageUrl)}
                  alt={driverLabel}
                  className="h-40 w-full object-cover"
                />
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {driverLabel}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    ${Number(driver.driverCost).toFixed(1)} M
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Constructors</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {teamSlots.map((slot, index) => {
            if (!slot?.teamId) {
              return (
                <div
                  key={`empty-team-${index}`}
                  className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400"
                >
                  <img
                    src={EMPTY_IMAGE}
                    alt="Empty constructor slot"
                    className="h-20 w-32 object-cover opacity-60"
                  />
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide">
                    Empty Constructor Slot
                  </p>
                </div>
              );
            }

            const team = slot.teamId;
            return (
              <article
                key={team._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <img
                  src={resolveAssetUrl(team.imageUrl)}
                  alt={team.name}
                  className="h-40 w-full object-cover"
                />
                <div className="p-4">
                  <p className="truncate text-lg font-bold text-slate-900">
                    {team.fullName || team.name}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    ${Number(team.teamCost).toFixed(1)} M
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Race History
        </h2>
        <ul className="space-y-3">
          {normalizedHistory.map(({ roundNumber, status, record }) => {
            const circuitName = record?.raceId?.circuitName ?? "";
            const points = record?.pointsEarned ?? 0;

            let label = "No participation";
            let colorClass = "text-red-500";
            if (status === "played") {
              label = `${points} pts`;
              colorClass = "text-emerald-600";
            } else if (status === "not_created") {
              label = "Team not created yet";
              colorClass = "text-slate-500";
            }

            return (
              <li
                key={roundNumber}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-800">
                  Round {roundNumber}
                  {circuitName ? ` - ${circuitName}` : ""}
                </p>
                <p className={`mt-1 text-sm ${colorClass}`}>{label}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default FantasyTeamView;
