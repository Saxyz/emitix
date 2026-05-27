package com.unimag.emitix.mapper;

import com.unimag.emitix.dto.InvoiceItemResponse;
import com.unimag.emitix.entity.InvoiceItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface InvoiceItemMapper {

    InvoiceItemResponse toResponse(InvoiceItem item);
}
