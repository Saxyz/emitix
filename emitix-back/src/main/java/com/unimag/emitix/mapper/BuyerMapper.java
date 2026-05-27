package com.unimag.emitix.mapper;

import com.unimag.emitix.dto.BuyerResponse;
import com.unimag.emitix.entity.Buyer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BuyerMapper {

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "active", target = "isActive")
    BuyerResponse toResponse(Buyer buyer);
}
