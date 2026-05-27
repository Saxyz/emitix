package com.unimag.emitix.mapper;

import com.unimag.emitix.dto.InvoiceResponse;
import com.unimag.emitix.entity.Invoice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {BuyerMapper.class, CompanyMapper.class, InvoiceItemMapper.class})
public interface InvoiceMapper {

    @Mapping(source = "createdBy.fullName", target = "createdBy")
    InvoiceResponse toResponse(Invoice invoice);
}
