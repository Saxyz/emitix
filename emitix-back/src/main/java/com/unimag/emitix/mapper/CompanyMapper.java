package com.unimag.emitix.mapper;

import com.unimag.emitix.dto.CompanyRequest;
import com.unimag.emitix.dto.CompanyResponse;
import com.unimag.emitix.entity.Company;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CompanyMapper {

    CompanyResponse toResponse(Company company);

    void updateFromRequest(CompanyRequest request, @MappingTarget Company company);
}
