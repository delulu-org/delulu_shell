import './BrowseHeader.css';

interface BrowseHeaderProps {
    tag: string;       // e.g. "Curated Cinema"
    note: string;      // e.g. "One strong film at a time."
}

export function BrowseHeader({ tag, note }: BrowseHeaderProps) {
    return (
        <header className="browse-header">
            <span className="browse-header__tag">{tag}</span>
            <p className="browse-header__note">{note}</p>
        </header>
    );
}
