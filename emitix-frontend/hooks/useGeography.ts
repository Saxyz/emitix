import { useState, useEffect } from 'react'
import { geographyApi, type Department, type City } from '@/lib/api/geography'

export function useGeography() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    setLoadingDepts(true)
    geographyApi
      .getDepartments()
      .then((data) => setDepartments(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {})
      .finally(() => setLoadingDepts(false))
  }, [])

  const loadCities = (departmentId: number | null) => {
    setCities([])
    if (departmentId === null) return
    setLoadingCities(true)
    geographyApi
      .getCities(departmentId)
      .then((data) => setCities(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {})
      .finally(() => setLoadingCities(false))
  }

  return { departments, cities, loadingDepts, loadingCities, loadCities }
}
