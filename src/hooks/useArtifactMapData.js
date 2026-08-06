import { useEffect, useState } from 'react';
import { apiUrl } from '../config';

export function useArtifactMapData() {
  const [artifacts, setArtifacts] = useState([]);
  const [locationsById, setLocationsById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const artifactsRes = await fetch(apiUrl('/api/artifacts/')).then(r => r.json());

      // collect every distinct location id referenced across all artifacts
      const idSet = new Set();
      artifactsRes.forEach(a => {
        [a.discovery_location_id, a.current_location_id, a.origin_location_id]
          .filter(Boolean)
          .forEach(id => idSet.add(id));
      });

      // fetch each unique location exactly once, in parallel
      const entries = await Promise.all(
        [...idSet].map(id =>
          fetch(apiUrl(`/api/artifacts/location/${id}`))
            .then(r => r.json())
            .then(loc => [id, loc])
        )
      );

      setArtifacts(artifactsRes);
      setLocationsById(Object.fromEntries(entries));
      setLoading(false);
    }
    load();
  }, []);

  return { artifacts, locationsById, loading };
}
