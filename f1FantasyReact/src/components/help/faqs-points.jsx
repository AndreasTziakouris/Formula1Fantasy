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
    { pos: "11-20", pts: 0 },
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
    { pos: "9-20", pts: 0 },
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
    { pos: "11-20", pts: 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          FAQs & Points Logic
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          How points are calculated for drivers and constructors, plus answers
          to the most common gameplay questions.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          3.1 Qualifying
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Driver qualifying points are awarded directly from qualifying position.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 font-semibold text-slate-700">Position</th>
                <th className="py-2 font-semibold text-slate-700">Driver Pts</th>
              </tr>
            </thead>
            <tbody>
              {qualiPoints.map((row) => (
                <tr key={row.pos} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-800">{row.pos}</td>
                  <td className="py-2 font-medium text-slate-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Constructor qualifying bonuses
          </p>
          <ul className="space-y-1 text-sm text-slate-700">
            <li>Neither driver reaches Q2 {"->"} -1</li>
            <li>One driver reaches Q2 {"->"} +1</li>
            <li>Both drivers reach Q2 {"->"} +3</li>
            <li>One driver reaches Q3 {"->"} +5</li>
            <li>Both drivers reach Q3 {"->"} +10</li>
          </ul>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          3.2 Sprint (Rounds 2 & 6 only)
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Sprint positions score points, but sprint gains and losses do not add
          extra position-change bonuses.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 font-semibold text-slate-700">Position</th>
                <th className="py-2 font-semibold text-slate-700">Driver Pts</th>
              </tr>
            </thead>
            <tbody>
              {sprintPoints.map((row) => (
                <tr key={row.pos} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-800">{row.pos}</td>
                  <td className="py-2 font-medium text-slate-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          <li>Fastest lap: +5</li>
          <li>Constructor sprint points: sum of both drivers&apos; sprint points</li>
        </ul>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">3.3 Race</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 font-semibold text-slate-700">Position</th>
                <th className="py-2 font-semibold text-slate-700">Driver Pts</th>
              </tr>
            </thead>
            <tbody>
              {racePoints.map((row) => (
                <tr key={row.pos} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-800">{row.pos}</td>
                  <td className="py-2 font-medium text-slate-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-sm font-semibold text-slate-800">
              Additional driver race bonuses
            </p>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>Positions gained: +1 each</li>
              <li>Positions lost: -1 each</li>
              <li>Fastest lap: +10</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-sm font-semibold text-slate-800">
              Constructor race scoring
            </p>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>Constructor race points = sum of both drivers&apos; race points</li>
              <li>Fastest pit stop: +10</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          3.4 Total Fantasy Points
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-1 text-sm font-semibold text-slate-800">Driver</p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900">
              driver.points = quali + sprint + race
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-1 text-sm font-semibold text-slate-800">
              Constructor
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900">
              constructor.overallPoints = sum(driver.points) + quali bonus +
              fastest pit stop
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">FAQs</h2>

        <details className="group mb-2 rounded-lg border border-slate-200 p-3 open:bg-slate-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
            Do sprint positions affect “places gained/lost”?
          </summary>
          <p className="mt-2 text-sm text-slate-700">
            No. Sprint positions do not add or subtract position-change points.
            Only the main race uses places gained and lost for bonus scoring.
          </p>
        </details>

        <details className="group mb-2 rounded-lg border border-slate-200 p-3 open:bg-slate-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
            How does DRS (x2) affect my driver?
          </summary>
          <p className="mt-2 text-sm text-slate-700">
            Your chosen DRS driver earns double their individual points for that
            round. Constructors are unaffected.
          </p>
        </details>

        <details className="group mb-2 rounded-lg border border-slate-200 p-3 open:bg-slate-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
            My team was created mid-season. Do I get points for earlier rounds?
          </summary>
          <p className="mt-2 text-sm text-slate-700">
            No. You only score from the round your team was created onward.
            Earlier rounds are shown as “team not created yet”.
          </p>
        </details>

        <details className="group mb-2 rounded-lg border border-slate-200 p-3 open:bg-slate-50">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
            Do constructor qualifying bonuses stack?
          </summary>
          <p className="mt-2 text-sm text-slate-700">
            No. The constructor receives one qualifying bonus per round: the
            highest tier it reached.
          </p>
        </details>
      </section>
    </div>
  );
};

export default FaqsPoints;
