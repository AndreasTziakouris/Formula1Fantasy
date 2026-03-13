// src/components/help/faqs-points.jsx
import React from "react";

const FaqsPoints = () => {
  const qualiPoints = [
    { pos: 1, pts: 10 },
    { pos: 2, pts: 9 },
    { pos: 3, pts: 8 },
    { pos: 4, pts: 7 },
    { pos: 5, pts: 6 },
    { pos: 6, pts: 5 },
    { pos: 7, pts: 4 },
    { pos: 8, pts: 3 },
    { pos: 9, pts: 2 },
    { pos: 10, pts: 1 },
    { pos: "11–20", pts: 0 },
  ];

  const sprintPoints = [
    { pos: 1, pts: 8 },
    { pos: 2, pts: 7 },
    { pos: 3, pts: 6 },
    { pos: 4, pts: 5 },
    { pos: 5, pts: 4 },
    { pos: 6, pts: 3 },
    { pos: 7, pts: 2 },
    { pos: 8, pts: 1 },
    { pos: "9–20", pts: 0 },
  ];

  const racePoints = [
    { pos: 1, pts: 25 },
    { pos: 2, pts: 18 },
    { pos: 3, pts: 15 },
    { pos: 4, pts: 12 },
    { pos: 5, pts: 10 },
    { pos: 6, pts: 8 },
    { pos: 7, pts: 6 },
    { pos: 8, pts: 4 },
    { pos: 9, pts: 2 },
    { pos: 10, pts: 1 },
    { pos: "11–20", pts: 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Page header */}
      <header className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          FAQs & Points Logic
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          How points are calculated for drivers and constructors, plus answers
          to common questions.
        </p>
      </header>

      {/* 3.1 Qualifying */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          3.1 Qualifying
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          Points are based on <strong>qualifying position </strong>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-semibold text-gray-700">Position</th>
                <th className="py-2 font-semibold text-gray-700">Driver Pts</th>
              </tr>
            </thead>
            <tbody>
              {qualiPoints.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 text-gray-800">{row.pos}</td>
                  <td className="py-2 font-medium text-gray-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-sm font-semibold text-gray-800">
            Constructor Quali Bonuses (applied once, highest tier only)
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              Neither driver reaches Q2 → <strong>-1</strong>
            </li>
            <li>
              One driver reaches Q2 → <strong>+1</strong>
            </li>
            <li>
              Both drivers reach Q2 → <strong>+3</strong>
            </li>
            <li>
              One driver reaches Q3 → <strong>+5</strong>
            </li>
            <li>
              Both drivers reach Q3 → <strong>+10</strong>
            </li>
          </ul>
        </div>
      </section>

      {/* 3.2 Sprint */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          3.2 Sprint (Rounds 2 &amp; 6 only)
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          Positions gained/lost in the sprint <strong>do not affect</strong>{" "}
          points.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-semibold text-gray-700">Position</th>
                <th className="py-2 font-semibold text-gray-700">Driver Pts</th>
              </tr>
            </thead>
            <tbody>
              {sprintPoints.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 text-gray-800">{row.pos}</td>
                  <td className="py-2 font-medium text-gray-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-3 text-sm text-gray-700 space-y-1">
          <li>
            Fastest Lap: <strong>+5</strong>
          </li>
          <li>
            Constructor Sprint Points:{" "}
            <strong>sum of both drivers’ sprint points</strong> (no extra
            bonuses)
          </li>
        </ul>
      </section>

      {/* 3.3 Race */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">3.3 Race</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-semibold text-gray-700">Position</th>
                <th className="py-2 font-semibold text-gray-700">Driver Pts</th>
              </tr>
            </thead>
            <tbody>
              {racePoints.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 text-gray-800">{row.pos}</td>
                  <td className="py-2 font-medium text-gray-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="mb-1 text-sm font-semibold text-gray-800">
              Additional Driver Race Bonuses
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                Positions Gained: <strong>+1</strong> each
              </li>
              <li>
                Positions Lost: <strong>-1</strong> each
              </li>
              <li>
                Fastest Lap: <strong>+10</strong>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="mb-1 text-sm font-semibold text-gray-800">
              Constructor Race Points
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                Constructor Race Points ={" "}
                <strong>sum of both drivers’ race points</strong>
              </li>
              <li>
                Fastest Pit Stop (DHL): <strong>+10</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3.4 Totals */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          3.4 Total Fantasy Points
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-1 text-sm font-semibold text-gray-800">Driver</p>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-900">
              driver.points = QualiPts + SprintPts + RacePts
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-1 text-sm font-semibold text-gray-800">
              Constructor
            </p>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-900">
              constructor.overallPoints = Σ(driver.points) + QualiBonus +
              FastestPitStop
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">FAQs</h2>

        <details className="group mb-2 rounded-lg border border-gray-200 p-3 open:bg-gray-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
            Do sprint positions affect “places gained/lost”?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            No. Sprint positions do not add or subtract position-change points.
            Only the main race uses places gained/lost for driver bonuses.
          </p>
        </details>

        <details className="group mb-2 rounded-lg border border-gray-200 p-3 open:bg-gray-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
            How does DRS (x2) affect my driver?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            Your chosen DRS driver earns <strong>double</strong> their
            individual points for that round. Constructors are unaffected by the
            DRS choice.
          </p>
        </details>

        <details className="group mb-2 rounded-lg border border-gray-200 p-3 open:bg-gray-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
            My team was created mid-season. Do I get points for earlier rounds?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            No. You only score from the round your team was created onward
            (shown as “team not created yet” in race history before that round).
          </p>
        </details>

        <details className="group mb-2 rounded-lg border border-gray-200 p-3 open:bg-gray-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
            Do constructor bonuses stack in qualifying?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            No. The constructor gets <strong>one</strong> qualifying bonus per
            round: the highest tier they qualify for (they don’t stack).
          </p>
        </details>
      </section>
    </div>
  );
};

export default FaqsPoints;
