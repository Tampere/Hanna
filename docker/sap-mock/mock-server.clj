#!/usr/bin/env bb
(ns mock-server
  (:require [org.httpkit.server :as http]
            [clojure.data.xml :as xml]
            [clojure.string :as str]
            [clojure.pprint :refer [pprint]]
            [clojure.tools.logging :as log]
            [schema.core :as s])
  (:refer-clojure :exclude [rand rand-nth rand-int]))

;;
;; Randomisation utilities
;;

(def ^{:dynamic true} *random*)

(defn set-seed! [seed]
  (.setSeed *random* seed))

(defn rand-int [max-value]
  (.nextInt *random* max-value))

(defn rand-nth [seq]
  (nth seq (.nextInt *random* (count seq))))

(defn generate-project-description [area]
  (str area ", " (rand-nth ["yleiskaava" "kehitys" "asemakaava" "investointihanke" "ylläpito"])))

(defn generate-random-name []
  {:last-name (rand-nth ["Mäkinen" "Nieminen"])
   :first-name (rand-nth ["Matti" "Liisa"])})

(defn short-name [name]
  (str/upper-case
   (str
    (apply str (take 5 (name :first-name)))
    (apply str (take 3 (name :last-name))))))

(defn generate-random-id [max-value length]
  (let [value (rand-int max-value)]
    (format (str "%0" length "d") value)))

(defn generate-random-date [start upper-range-days]
  (.plusDays start (rand-int (+ upper-range-days 1))))

(defn generate-date-between [start end]
  (let [days-between (.until start end java.time.temporal.ChronoUnit/DAYS)]
    (generate-random-date start days-between)))

;;
;; Random domain object generation
;;

(defn random-network
  [{:keys [activity-count start-date finish-date] :as config}
   {:keys [wbs-id project-description project-internal-id project-creation-date company-code plant]}]
  (let [order-number (generate-random-id 99999999 12)
        creation-date (generate-random-date project-creation-date 30)
        scheduled-start (generate-date-between start-date finish-date)
        scheduled-finish (generate-date-between scheduled-start finish-date)
        profit-center-id (generate-random-id 999999 10)
        operations-routing-number (generate-random-id 99999 10)]
    (into
     {}
     [[:AUFNR order-number]
      [:KTEXT project-description]
      [:PSPEL wbs-id]
      [:PSPHI project-internal-id]
      [:ERNAM (short-name (generate-random-name))]
      [:ERDAT creation-date] ;; created on
      [:GSTRS scheduled-start] ;; scheduled start
      [:GLTRS scheduled-finish] ;; scheduled finish
      [:FTRMS (generate-random-date scheduled-start 30)] ;; scheduled release date
      [:GSTRP (generate-random-date scheduled-start 15)] ;; basic start date
      [:GLTRP (generate-random-date scheduled-finish 10)] ;; basic finish date
      [:GSTRI (generate-random-date scheduled-start 5)] ;; actual start date
      [:GETRI "0000-00-00"] ;; confirmed order finish date
      [:FTMRI "0000-00-00"] ;; actual release date
      [:AENAM (short-name (generate-random-name))] ;; last changed by
      [:AEDAT ""] ;; Change date for order master
      [:BUKRS company-code]
      [:WERKS plant]
      [:SOWRK ""] ;; location plant
      [:IDAT2 (generate-random-date scheduled-finish 10)] ;; technical completion date
      [:PRCTR profit-center-id]
      [:KDAUF ""] ;; sales order number
      [:KDPOS "00000"] ;;" Item number in sales order"
      [:VAPLZ ""] ;; "Main work center for maintenance tasks"
      [:ACTIVITY
       (mapv
        (fn [x]
          (let [activity-num (generate-random-id 9999 4)
                description (rand-nth ["Rakentaminen" "Kunnossapito" "Lisätyö" "Dokumentointi" "Ylläpito" "Muu"])]
            (into
             {}
             [[:AUFPL operations-routing-number]
              [:APLZL (format "%08d" (inc x))]
              [:VORNR activity-num]
              [:AUFNR order-number]
              [:LTXA1 description]
              [:PSPHI project-internal-id]
              [:PSPEL wbs-id]
              [:PRCTR profit-center-id]
              [:WERKS plant]])))
        (range activity-count))]])))

(defn random-wbs
  [{:keys [wbs-count start-date finish-date] :as config}
   {:keys [project-description project-id project-internal-id project-creation-date plant] :as ctx}]
  (let [wbs-created-date (.plusDays project-creation-date (rand-int 30))
        creator (generate-random-name)
        applicant (generate-random-name)
        cost-center (generate-random-id (rand-int 999999) 8)
        technically-completed-date (generate-date-between start-date finish-date)]
    (mapv
     (fn [id]
       (let [wbs-id (generate-random-id 999999 8)]
         (into
          {}
          [[:PSPNR wbs-id]
           [:POSID (str project-id id)]
           [:POST1 (str project-description ", kohde " (inc id))]
           [:OBJNR (str "PR" (generate-random-id 999999 8))]
           [:PSPHI project-internal-id]
           [:ERNAM (short-name creator)]
           [:ERDAT wbs-created-date]
           [:AENAM (short-name (generate-random-name))]
           [:AEDAT (.plusDays wbs-created-date (rand-int 30))]
           [:VERNR (generate-random-id 999999 8)] ;; project manager id
           [:ASTNR (generate-random-id 999999 8)] ;; applicant id
           [:ASTNA (str (:last-name applicant) " " (:first-name applicant))]
           [:STUFE 2] ;; level in project hierarchy
           [:AKSTL cost-center]
           [:FKSTL cost-center]
           [:PRART "Y4"] ;; project type
           [:PSPRI "U"] ;; priority
           [:WERKS plant]
           [:TADAT (if (.isBefore technically-completed-date (java.time.LocalDate/now))
                     technically-completed-date
                     nil)]
           [:IZWEK "30"] ;; reason for investment
           [:IUMKZ "414"] ;; reason for environmental investment
           [:NETWORK (random-network config (assoc ctx :wbs-id wbs-id))]])))
     (range wbs-count))))

(defn random-project-data [project-id]
  (let [;; decode mock data parameters from the id part
        ;; e.g. I1112_34567
        ;; -> 3 WBS elements, 4 activities per WBS
        [_ id] (str/split project-id #"_")
        [wbs-count activity-count] (take 2 id)
        wbs-count (- (int wbs-count) 48)
        activity-count (- (int activity-count) 48)
        area (rand-nth ["Tesoma" "Hervanta" "Lielahti" "Keskusta" "Kaleva" "Pyynikki"])
        config {:area area :wbs-count wbs-count :activity-count activity-count}
        [plant _] (str/split project-id #"_")
        plant (subs plant 1)
        internal-id (generate-random-id 100000 8)
        project-creator (generate-random-name)
        project-creation-date (generate-random-date (java.time.LocalDate/of 2019 06 01) 365)
        project-updater (generate-random-name)
        project-manager (generate-random-name)
        applicant (generate-random-name)
        company-code (generate-random-id 9999 4)
        planned-start-date (generate-random-date project-creation-date 30)
        planned-finish-date (generate-random-date (.plusDays planned-start-date (rand-int (* 5 365))) 30)
        project-description (generate-project-description area)]
    (into
     {}
     [[:PSPNR internal-id]
      [:PSPID project-id]
      [:POST1 project-description]
      [:ERNAM (short-name project-creator)]
      [:ERDAT project-creation-date]
      [:AENAM (short-name project-updater)]
      [:AEDAT (generate-random-date (.plusDays project-creation-date 30) 30)]
      [:VERNR (generate-random-id 100000 8)]
      [:VERNA (str (:last-name project-manager) " " (:first-name project-manager))]
      [:ASTNR (generate-random-id 100000 8)]
      [:ASTNA (str (:last-name applicant) " " (:first-name applicant))]
      [:VBUKR company-code]
      [:PLFAZ planned-start-date]
      [:PLSEZ planned-finish-date]
      [:WERKS plant]
      [:WBS
       (random-wbs
        (assoc config :start-date planned-start-date :finish-date planned-finish-date)
        {:project-id project-id
         :project-description project-description
         :project-internal-id internal-id
         :project-creation-date project-creation-date
         :company-code company-code
         :plant plant})]])))

(defn random-actuals-data [project]
  (for [num-of-actuals (range (+ (rand-int 1000) 250))
        :let [amount (+ (rand-int 10000) 500)
              amount-fmt (apply str amount "." (format "%02d" (rand-int 100)))
              debit {:BEKNZ "S" :OBART "NV" :WTGBTR amount-fmt}
              credit {:BEKNZ "H" :OBART "PR" :WTGBTR (str "-" amount-fmt)}
              transaction (rand-nth [debit debit credit])
              wbs (-> project :WBS rand-nth)
              {:keys [GSTRS GLTRS]} (:NETWORK wbs)
              item-date (generate-date-between GSTRS GLTRS)]]
    {:BELNR (generate-random-id 999999999 10)
       ;; TODO: random dates from valid range
     :GJAHR (.getYear item-date)
     :BLDAT (generate-random-date item-date (rand-int 2))
     :BUDAT (generate-random-date item-date (rand-int 2))
     :CPUDT (generate-random-date item-date (rand-int 2))
     :PSPID (:PSPID project)
     :POSID (:POSID wbs)
     :AUFNR (-> wbs :NETWORK :AUFNR)
     :VORNR ""
     :OBJ_TXT (rand-nth ["Selvitys" "Valmistelu" "Aloitus" "Ehdotus"])
     :OBART (:OBART transaction)
     :TWAER "EUR"
     :WTGBTR (:WTGBTR transaction)
     :BEKNZ (:BEKNZ transaction)}))

  ;;
;; Data to output XML
;;

(defn generate-activity-elems [activity-seq]
  (map
   (fn [{:keys [AUFPL APLZL VORNR AUFNR LTXA1 PSPHI PSPEL PRCTR WERKS]}]
     [:item
      [:AUFPL AUFPL]
      [:APLZL APLZL]
      [:VORNR VORNR]
      [:AUFNR AUFNR]
      [:LTXA1 LTXA1]
      [:PSPHI PSPHI]
      [:PSPEL PSPEL]
      [:PRCTR PRCTR]
      [:WERKS WERKS]])
   activity-seq))

(defn generate-network-elem [{:keys [ACTIVITY] :as network}]
  [:item
   [:AUFNR (:AUFNR network)]
   [:KTEXT (:KTEXT network)]
   [:PSPEL (:PSPEL network)]
   [:PSPHI (:PSPHI network)]
   [:ERNAM (:ERNAM network)]
   [:ERDAT (:ERDAT network)]
   [:GSTRS (:GSTRS network)]
   [:GLTRS (:GLTRS network)]
   [:FTRMS (:FTMRS network)]
   [:GSTRP (:GSTRP network)]
   [:GLTRP (:GLTRP network)]
   [:GSTRI (:GSTRI network)]
   [:GETRI (:GETRI network)]
   [:FTMRI (:FTMRI network)]
   [:AENAM (:AENAM network)]
   [:AEDAT (:AEDAT network)]
   [:BUKRS (:BUKRS network)]
   [:WERKS (:WERKS network)]
   [:SOWRK (:SOWRK network)]
   [:IDAT2 (:IDAT2 network)]
   [:PRCTR (:PRCTR network)]
   [:KDAUF (:KDAUF network)]
   [:KDPOS (:KDPOS network)]
   [:VAPLZ (:VAPLZ network)]
   [:ACTIVITY (generate-activity-elems ACTIVITY)]])

(defn generate-wbs-elements [wbs-seq]
  (map
   (fn [{:keys [NETWORK] :as wbs}]
     [:item
      [:PSPNR (:PSPNR wbs)]
      [:POSID (:POSID wbs)]
      [:POST1 (:POST1 wbs)]
      [:OBJNR (:OBJNR wbs)]
      [:PSPHI (:PSPHI wbs)]
      [:ERNAM (:ERNAM wbs)]
      [:ERDAT (:ERDAT wbs)]
      [:AENAM (:AENAM wbs)]
      [:AEDAT (:AEDAT wbs)]
      [:VERNR (:VERNR wbs)]
      [:ASTNR (:ASTNR wbs)]
      [:ASTNA (:ASTNA wbs)]
      [:STUFE (:STUFE wbs)]
      [:AKSTL (:AKSTL wbs)]
      [:FKSTL (:FKSTL wbs)]
      [:PRART (:PRART wbs)]
      [:PSPRI (:PSPRI wbs)]
      [:WERKS (:WERKS wbs)]
      [:TADAT (:TADAT wbs)]
      [:IZWEK (:IZWEK wbs)]
      [:IUMKZ (:IUMKZ wbs)]
      [:NETWORK (generate-network-elem NETWORK)]])
   wbs-seq))

(defn generate-project-data [{:keys [WBS] :as project-data}]
  [:PROJECT_INFO [:item
                  [:PSPNR (:PSPNR project-data)]
                  [:PSPID (:PSPID project-data)]
                  [:POST1 (:POST1 project-data)]
                  [:ERNAM (:ERNAM project-data)]
                  [:ERDAT (:ERDAT project-data)]
                  [:AENAM (:AENAM project-data)]
                  [:AEDAT (:AEDAT project-data)]
                  [:VERNR (:VERNR project-data)]
                  [:VERNA (:VERNA project-data)]
                  [:ASTNR (:ASTNR project-data)]
                  [:ASTNA (:ASTNA project-data)]
                  [:VBUKR (:VBUKR project-data)]
                  [:PRCTR (:PRCTR project-data)]
                  [:PLFAZ (:PLFAZ project-data)]
                  [:PLSEZ (:PLSEZ project-data)]
                  [:WERKS (:WERKS project-data)]
                  [:WBS (generate-wbs-elements WBS)]]])

(defn generate-actuals-data [actuals]
  [:ACTUALS
   (map
    (fn [{:keys [BELNR GJAHR BLDAT BUDAT CPUDT PSPID POSID AUFNR VORNR OBJ_TXT OBART TWAER WTGBTR BEKNZ]}]
      [:item
       [:BELNR BELNR]
       [:GJAHR GJAHR]
       [:BLDAT BLDAT]
       [:BUDAT BUDAT]
       [:CPUDT CPUDT]
       [:PSPID PSPID]
       [:POSID POSID]
       [:AUFNR AUFNR]
       [:VORNR VORNR]
       [:OBJ_TXT OBJ_TXT]
       [:OBART OBART]
       [:TWAER TWAER]
       [:WTGBTR WTGBTR]
       [:BEKNZ BEKNZ]])
    actuals)])

(def not-found-response
  [[:MESSAGES [:item
               [:TYPE "E"]
               [:ID]
               [:NUMBER "000"]
               [:MESSAGE "Projektia ei löydy"]
               [:LOG_NO]
               [:MESSAGE_V1]
               [:MESSAGE_V2]
               [:MESSAGE_V3]
               [:MESSAGE_V4]
               [:PARAMETER]
               [:ROW]
               [:FIELD]
               [:SYSTEM]]]
   [:PROJECT_INFO
    [:PSPNR "00000000"]
    [:PSPID]
    [:POST1]
    [:ERNAM]
    [:ERDAT "0000-00-00"]
    [:AENAM]
    [:AEDAT]
    [:VERNR "00000000"]
    [:VERNA]
    [:ASTNR "00000000"]
    [:ASTNA]
    [:VBUKR]
    [:PRCTR]
    [:PLFAZ "0000-00-00"]
    [:PLSEZ "0000-00-00"]
    [:WERKS]
    [:WBS]]])

;;
;; XML utils
;;

(defn tag-name [tag]
  (some-> tag name keyword))

(defn preprocess-elem
  "Naive recursive XML to EDN conversion. Does not handle multiple same-named elements
   under the same parent and recursion could blow on large XMLs"
  [{:keys [tag content] :as elem}]
  (let [tag (tag-name tag)]
    (cond
      (and (string? elem) (not (str/blank? elem)))
      elem
      (some? tag)
      {tag (apply merge (map preprocess-elem content))})))

(defn ->soap-response [operation & body]
  (let [operation-kw (keyword (str "rfc:" (name operation) ".Response"))]
    (xml/indent-str
     (xml/sexp-as-element
      [:SOAP:Envelope
       {:xmlns:SOAP "http://schemas.xmlsoap.org/soap/envelope/"}
       [:SOAP:Body [operation-kw
                    {:xmlns:rfc "urn:sap-com:document:sap:rfc:functions"}
                    body]]]))))

;;
;; SOAP endpoints
;;

(s/defschema ProjectInfoSoapMessage
  {:Envelope
   {:Header s/Any
    :Body
    {:ZPS_WS_GET_PROJECT_INFO
     {:PROJECT s/Str}}}})

(defn process-projectinfo-request [body]
  (binding [*random* (java.util.Random.)]
    (let [root-elem (-> body xml/parse-str preprocess-elem)
          project-id (get-in root-elem [:Envelope :Body :ZPS_WS_GET_PROJECT_INFO :PROJECT])
          [_ id] (str/split project-id #"_")
          _ (set-seed! (Integer/parseInt id))
          project (random-project-data project-id)
          not-found? (= id "404")
          make-response (partial apply ->soap-response :ZPS_WS_GET_PROJECT_INFO)]
      (s/validate ProjectInfoSoapMessage root-elem)
      {:status 200
       :content-type "text/xml"
       :body (make-response
              (if not-found?
                not-found-response
                [[:MESSAGES]
                 (generate-project-data project)]))})))

(s/defschema ActualsSoapMessage
  {:Envelope
   {:Header s/Any
    :Body
    {:ZPS_WS_GET_ACTUALS
     {:I_PSPID s/Str
      (s/optional-key :I_POSID) (s/maybe s/Str)
      (s/optional-key :I_AUFNR) (s/maybe s/Str)
      (s/optional-key :I_BUDAT_BEGDA) (s/maybe s/Str)
      (s/optional-key :I_BUDAT_ENDDA) (s/maybe s/Str)}}}})

(defn filter-by-date-range [[start end] actuals]
  (if-not (and start end)
    actuals
    (let [start (java.time.LocalDate/parse start)
          end (java.time.LocalDate/parse end)]
      (filter
       (fn [{:keys [BUDAT]}]
         (and
          (not (.isAfter start BUDAT))
          (not (.isBefore end BUDAT))))
       actuals))))

(defn process-actuals-request [body]
  (binding [*random* (java.util.Random.)]
    (let [root-elem (-> body xml/parse-str preprocess-elem)]
      (s/validate ActualsSoapMessage root-elem)
      (let [params (get-in root-elem [:Envelope :Body :ZPS_WS_GET_ACTUALS])
            project-id (:I_PSPID params)
            query-date-range [(:I_BUDAT_BEGDA params) (:I_BUDAT_ENDDA params)]
            [_ id] (str/split project-id #"_")
            _ (set-seed! (Integer/parseInt id))
            project (random-project-data project-id)
            actuals (->> (random-actuals-data project)
                         (filter-by-date-range query-date-range))]
        {:status 200
         :content-type "text/xml"
         :body (->soap-response
                :ZPS_WS_GET_ACTUALS
                [:MESSAGES]
                (generate-actuals-data actuals))}))))

;;
;; Web server
;;

(defonce projectinfo-wsdl (slurp "projectinfo.wsdl"))
(defonce actuals-wsdl (slurp "actuals.wsdl"))

(defn handler [{:keys [query-string request-method uri body] :as req}]
  (log/debug (with-out-str (pprint req)))
  (cond
    (and (= request-method :get) (= uri "/projectinfo") (some-> query-string (str/includes? "wsdl")))
    {:status 200
     :headers {"Content-Type" "text/xml"}
     :body projectinfo-wsdl}

    (and (= request-method :get) (= uri "/actuals") (some-> query-string (str/includes? "wsdl")))
    {:status 200
     :headers {"Content-Type" "text/xml"}
     :body actuals-wsdl}

    (and (= request-method :post) (= uri "/projectinfo"))
    (-> body slurp process-projectinfo-request)

    (and (= request-method :post) (= uri "/actuals"))
    (-> body slurp process-actuals-request)))

(defn start-server [port]
  (log/info "Starting mock server on port..." port)
  (http/run-server handler {:port port})
  (log/info "Started"))

(start-server (or (Integer/parseInt (System/getenv "SAP_MOCK_PORT")) 3000))

@(promise)
