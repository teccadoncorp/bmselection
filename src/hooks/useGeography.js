import { useQuery } from '@tanstack/react-query'
import { geographyAPI } from '../api'

export function useStates() {
  return useQuery({
    queryKey: ['states'],
    queryFn: () => geographyAPI.states.list({ page_size: 100 }).then((r) => r.data.results || r.data),
  })
}

export function useDistricts(stateId) {
  return useQuery({
    queryKey: ['districts', stateId],
    queryFn: () => geographyAPI.districts.list({ state: stateId, page_size: 200 }).then((r) => r.data.results || r.data),
    enabled: true,
  })
}

export function useBlocks(districtId) {
  return useQuery({
    queryKey: ['blocks', districtId],
    queryFn: () => geographyAPI.blocks.list({ district: districtId, page_size: 200 }).then((r) => r.data.results || r.data),
    enabled: !!districtId,
  })
}

export function useGPs(blockId) {
  return useQuery({
    queryKey: ['gps', blockId],
    queryFn: () => geographyAPI.gps.list({ block: blockId, page_size: 200 }).then((r) => r.data.results || r.data),
    enabled: !!blockId,
  })
}
