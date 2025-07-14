
## Setup IFS

### supplier_info_tab upsert
* Custom-Event / Event-ID: `C_NXI_SUPPLIERINFO_UPSERT`
* Custom-Event / Descripton: `This event triggers when a supplier is created or updated`
* Custom-Event / Event Enabled: `True`
* Custom-Event / Logical Unit: `SupplierInfoGeneral`
* Custom-Event / Table: `SUPPLIER_INFO_TAB`
* Custom-Event / Fire When: `New objects are created`, `Objects are changed`
* Custom-Event / Fire before or afer object is changed: `After`
* Custom-Event / Select attributes: `SUPPLIER_ID`, `NAME`, `ROWKEY`
* Event-Action / Action Type: `REST Call`
* Event-Action / Perform upon Event: `C_NXI_SUPPLIERINFO_UPSERT`
* Event-Action / Action Description: `This action handles the creation or update of a supplier's information`
* Event-Action / REST End Point: `https://api.nxinvoice.dev/ifs-sync/v1/supplier_info_tab`
* Event-Action / Method: `POST`
* Event-Action / Sender: `NXI_REST_SENDER`
* Event-Action / Authenication: `Barear`
* Event-Action / API Key: `ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnZjbWNpT25zaWFXUWlPaUp2Y21kZk1ucE9PVXRoYkhjeE5GTk1URzlVYWtGcVQweHlZV1J5YzJ0cUluMHNJblI1Y0dVaU9pSnBabk11YzNWd2NHeHBaWElpZlEuRm1xMks1ejJ2akVTeVdJeUhhWWQ3ckc2bkpIZDYtX3Q5NDJ4R0RpYTlVMA==`
* Event-Action / Body:
    <details>
    <summary>Upsert</summary>

    ```json
    {
        "action": "upsert",
        "data": {
            "supplier_id": "&NEW:SUPPLIER_ID",
            "name": "&NEW:NAME",
            "external_id": "&NEW:ROWKEY"
        }
    }
    ```

    </details>

### supplier_info_tab delete
* Custom-Event / Event-ID: `C_NXI_SUPPLIERINFO_DELETE`
* Custom-Event / Descripton: `This event triggers when a supplier is deleted`
* Custom-Event / Event Enabled: `True`
* Custom-Event / Logical Unit: `SupplierInfoGeneral`
* Custom-Event / Table: `SUPPLIER_INFO_TAB`
* Custom-Event / Fire When: `Object are removed`
* Custom-Event / Fire before or afer object is changed: `After`
* Custom-Event / Select attributes: `ROWKEY`
* Event-Action / Action Type: `REST Call`
* Event-Action / Perform upon Event: `C_NXI_SUPPLIERINFO_DELETE`
* Event-Action / Action Description: `This action handles the removal of a supplier's information`
* Event-Action / REST End Point: `https://api.nxinvoice.dev/ifs-sync/v1/supplier_info_tab`
* Event-Action / Method: `POST`
* Event-Action / Sender: `NXI_REST_SENDER`
* Event-Action / Authenication: `Barear`
* Event-Action / API Key: `ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnZjbWNpT25zaWFXUWlPaUp2Y21kZk1ucE9PVXRoYkhjeE5GTk1URzlVYWtGcVQweHlZV1J5YzJ0cUluMHNJblI1Y0dVaU9pSnBabk11YzNWd2NHeHBaWElpZlEuRm1xMks1ejJ2akVTeVdJeUhhWWQ3ckc2bkpIZDYtX3Q5NDJ4R0RpYTlVMA==`
* Event-Action / Body:
    <details>
    <summary>Delete</summary>

    ```json
    {
        "action": "delete",
        "data": {
            "rowkey": "&NEW:ROWKEY"
        }
    }
    ```

### supplier_document_tax_info_tab upsert
* Custom-Event / Event-ID: `C_NXI_SUPPLIERTAX_UPSERT`
* Custom-Event / Descripton: `This event is triggered when a supplier's tax information is created or updated`
* Custom-Event / Event Enabled: `True`
* Custom-Event / Logical Unit: `SupplierDocumentTaxInfo`
* Custom-Event / Table: `SUPPLIER_DOCUMENT_TAX_INFO_TAB`
* Custom-Event / Fire When: `New objects are created`, `Objects are changed`
* Custom-Event / Fire before or afer object is changed: `After`
* Custom-Event / Select attributes: `SUPPLIER_ID`, `VAT_NO`, `ROWKEY`
* Event-Action / Action Type: `REST Call`
* Event-Action / Perform upon Event: `C_NXI_SUPPLIERTAX_UPSERT`
* Event-Action / Action Description: `This action is responsible for creating or updating the tax-related information of a supplier`
* Event-Action / REST End Point: `https://api.nxinvoice.dev/ifs-sync/v1/supplier_document_tax_info_tab`
* Event-Action / Method: `POST`
* Event-Action / Sender: `NXI_REST_SENDER`
* Event-Action / Authenication: `Barear`
* Event-Action / API Key: `ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnZjbWNpT25zaWFXUWlPaUp2Y21kZk1ucE9PVXRoYkhjeE5GTk1URzlVYWtGcVQweHlZV1J5YzJ0cUluMHNJblI1Y0dVaU9pSnBabk11YzNWd2NHeHBaWElpZlEuRm1xMks1ejJ2akVTeVdJeUhhWWQ3ckc2bkpIZDYtX3Q5NDJ4R0RpYTlVMA==`
* Event-Action / Body:
    <details>
    <summary>Upsert</summary>

    ```json
    {
        "action": "upsert",
        "data": {
            "supplier_id": "&NEW:SUPPLIER_ID",
            "vat_id": "&NEW:VAT_NO",
            "tax_id": "&NEW:VAT_NO",
            "rowkey": "&NEW:ROWKEY"
        }
    }
    ```

    </details>

### supplier_document_tax_info_tab delete
* Custom-Event / Event-ID: `C_NXI_SUPPLIERTAX_DELETE`
* Custom-Event / Descripton: `This event is triggered when a supplier's tax information is deleted`
* Custom-Event / Event Enabled: `True`
* Custom-Event / Logical Unit: `SupplierDocumentTaxInfo`
* Custom-Event / Table: `SUPPLIER_DOCUMENT_TAX_INFO_TAB`
* Custom-Event / Fire When: `Object are removed`
* Custom-Event / Fire before or afer object is changed: `After`
* Custom-Event / Select attributes: `ROWKEY`
* Event-Action / Action Type: `REST Call`
* Event-Action / Perform upon Event: `C_NXI_SUPPLIERTAX_DELETE`
* Event-Action / Action Description: `This action is responsible for removing the tax-related information of a supplier`
* Event-Action / REST End Point: `https://api.nxinvoice.dev/ifs-sync/v1/supplier_document_tax_info_tab`
* Event-Action / Method: `POST`
* Event-Action / Sender: `NXI_REST_SENDER`
* Event-Action / Authenication: `Barear`
* Event-Action / API Key: `{{base64 encoded api key}}`
* Event-Action / Body:
    <details>
    <summary>Delete</summary>

    ```json
    {
        "action": "delete",
        "data": {
            "rowkey": "&NEW:ROWKEY"
        }
    }
    ```

    </details>

### payment_address_tab upsert
* Custom-Event / Event-ID: `C_NXI_PAYMENTADDRESS_UPSERT`
* Custom-Event / Descripton: `This event is triggered when a supplier's payment address information is created or updated`
* Custom-Event / Event Enabled: `True`
* Custom-Event / Logical Unit: `PaymentAddress`
* Custom-Event / Table: `PAYMENT_ADDRESS_TAB`
* Custom-Event / Fire When: `New objects are created`, `Objects are changed`
* Custom-Event / Fire before or afer object is changed: `After`
* Custom-Event / Select attributes: `IDENTIFY`, `VAT_NO`, `ROWKEY`
* Event-Action / Action Type: `REST Call`
* Event-Action / Perform upon Event: `C_NXI_PAYMENTADDRESS_UPSERT`
* Event-Action / Action Description: `This action is responsible for creating or updating a supplier's payment address information`
* Event-Action / REST End Point: `https://api.nxinvoice.dev/ifs-sync/v1/payment_address_tab`
* Event-Action / Method: `POST`
* Event-Action / Sender: `NXI_REST_SENDER`
* Event-Action / Authenication: `Barear`
* Event-Action / API Key: `{{base64 encoded api key}}`
* Event-Action / Body:
    <details>
    <summary>Upsert</summary>

    ```json
    {
        "action": "upsert",
        "data": {
            "identity": "&NEW:IDENTIFY",
            "supplier_name": "&NEW:DATA10",
            "bank_name": "&NEW:DESCRIPTION",
            "account": "&NEW:ACCOUNT",
            "bic_code": "&NEW:BIC_CODE",
            "default_address": "&NEW:DEFAULT_ADDRESS",
            "blocked_for_use": "&NEW:BLOCKED_FOR_USE",
            "way_id": "&NEW:WAY_ID",
            "address_id": "&NEW:ADDRESS_ID",
            "rowkey": "&NEW:ROWKEY",
        }
    }
    ```

    </details>

### payment_address_tab delete
* Custom-Event / Event-ID: `C_NXI_PAYMENTADDRESS_DELETE`
* Custom-Event / Descripton: `This event is triggered when a supplier's payment address information is deleted`
* Custom-Event / Event Enabled: `True`
* Custom-Event / Logical Unit: `PaymentAddress`
* Custom-Event / Table: `PAYMENT_ADDRESS_TAB`
* Custom-Event / Fire When: `Object are removed`
* Custom-Event / Fire before or afer object is changed: `After`
* Custom-Event / Select attributes: `ROWKEY`
* Event-Action / Action Type: `REST Call`
* Event-Action / Perform upon Event: `C_NXI_PAYMENTADDRESS_DELETE`
* Event-Action / Action Description: `This action is responsible for removing a supplier's payment address information`
* Event-Action / REST End Point: `https://api.nxinvoice.dev/ifs-sync/v1/payment_address_tab`
* Event-Action / Method: `POST`
* Event-Action / Sender: `NXI_REST_SENDER`
* Event-Action / Authenication: `Barear`
* Event-Action / API Key: `ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnZjbWNpT25zaWFXUWlPaUp2Y21kZk1ucE9PVXRoYkhjeE5GTk1URzlVYWtGcVQweHlZV1J5YzJ0cUluMHNJblI1Y0dVaU9pSnBabk11YzNWd2NHeHBaWElpZlEuRm1xMks1ejJ2akVTeVdJeUhhWWQ3ckc2bkpIZDYtX3Q5NDJ4R0RpYTlVMA==`
* Event-Action / Body:
    <details>
    <summary>Delete</summary>

    ```json
    {
        "action": "delete",
        "data": {
            "rowkey": "&NEW:ROWKEY"
        }
    }
    ```

    </details>
