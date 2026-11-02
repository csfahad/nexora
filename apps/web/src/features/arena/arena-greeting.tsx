import { useEffect, useState } from "react";

export const ArenaGreeting = ({ name }: { readonly name: string | null }) => {
    const [visit, setVisit] = useState<Readonly<{
        hour: number;
        variation: number;
    }> | null>(null);

    useEffect(() => {
        setVisit({
            hour: new Date().getHours(),
            variation: Math.floor(Math.random() * 4),
        });
    }, []);

    const firstName = name?.trim().split(/\s+/u)[0];
    const addressee = firstName ? `, ${firstName}` : "";
    const period =
        visit === null
            ? null
            : visit.hour < 5 || visit.hour >= 22
              ? "night"
              : visit.hour < 12
                ? "morning"
                : visit.hour < 17
                  ? "afternoon"
                  : "evening";
    const greetings = [
        period === "night"
            ? `Up for a little exploring${addressee}?`
            : `Good ${period}${addressee}.`,
        `What’s cooking${addressee}?`,
        `What’s on your mind${addressee}?`,
        `What shall we explore${addressee}?`,
    ];

    return <h1>{greetings[visit?.variation ?? 2]}</h1>;
};
