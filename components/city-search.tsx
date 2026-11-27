'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CityLocation } from '@/types';

interface CitySearchProps {
  onSelect: (city: CityLocation) => void;
  /** Announced to screen readers while a request is in flight. */
  label?: string;
}

/** Debounced city autocomplete backed by /api/geocode, plus geolocation button. */
export function CitySearch({ onSelect, label = 'Search for a city' }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('failed');
        const data: unknown = await response.json();
        const cities =
          data && typeof data === 'object' && Array.isArray((data as { cities?: CityLocation[] }).cities)
            ? (data as { cities: CityLocation[] }).cities
            : [];
        setResults(cities);
        setOpen(true);
        setActiveIndex(-1);
        setError(cities.length === 0 ? 'No cities matched your search.' : null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('City search is unavailable right now.');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function choose(city: CityLocation) {
    onSelect(city);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location detection. Please search for a city.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`/api/geocode?q=${encodeURIComponent(`${position.coords.latitude},${position.coords.longitude}`)}`);
          if (!response.ok) throw new Error();
          const data: unknown = await response.json();
          const cities =
            data && typeof data === 'object' && Array.isArray((data as { cities?: CityLocation[] }).cities)
              ? (data as { cities: CityLocation[] }).cities
              : [];
          if (cities.length > 0) {
            choose({ ...cities[0], latitude: position.coords.latitude, longitude: position.coords.longitude });
          } else {
            choose({
              id: 'current-location',
              name: 'My location',
              country: '',
              countryCode: '',
              admin1: null,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timezone: null,
              population: null,
            });
          }
        } catch {
          choose({
            id: 'current-location',
            name: 'My location',
            country: '',
            countryCode: '',
            admin1: null,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timezone: null,
            population: null,
          });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError('Location permission was denied. You can search for your city instead.');
      },
      { timeout: 10_000 }
    );
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative" role="combobox" aria-expanded={open} aria-haspopup="listbox">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={label}
            aria-label={label}
            aria-autocomplete="list"
            aria-controls="city-search-listbox"
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating}>
          <MapPin className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only sm:ml-1">{locating ? 'Locating…' : 'My location'}</span>
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        {loading ? 'Searching cities…' : error ?? ''}
      </p>

      {open && results.length > 0 && (
        <ul
          id="city-search-listbox"
          role="listbox"
          aria-label="City results"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {results.map((city, index) => (
            <li key={`${city.id}-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(city)}
                className={`flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm ${
                  index === activeIndex ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <span className="font-medium">{city.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[city.admin1, city.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
