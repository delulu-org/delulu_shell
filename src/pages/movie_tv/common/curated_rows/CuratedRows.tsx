import { useNavigate } from 'react-router-dom';
import { CuratedCard } from '../cards/CuratedCard';
import type { SectionRow } from '../../../../api/types';
import './CuratedRows.css';

interface CuratedRowsProps {
    rows: SectionRow[];
    mediaType: 'movie' | 'tv';
}

export function CuratedRows({ rows, mediaType }: CuratedRowsProps) {
    const navigate = useNavigate();

    const openDetails = (id: number) => {
        navigate(`/details/${mediaType}/${id}`);
    };

    return (
        <section className="curated-rows">
            {rows.map((row, index) => (
                <article
                    className={`curated-row${index === 0 ? ' curated-row--first' : ''}`}
                    key={row.id}
                >
                    <h2>{row.title}</h2>
                    {row.reason && <p>{row.reason}</p>}
                    <div className="curated-strip">
                        {row.items.map((item) => (
                            <CuratedCard
                                key={item.id}
                                item={item}
                                rowLabel={row.title}
                                rowReason={row.reason ?? ''}
                                onClick={openDetails}
                            />
                        ))}
                    </div>
                </article>
            ))}
        </section>
    );
}
